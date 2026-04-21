import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import { apiCache } from "@/lib/cache/with-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const approvalStatus = searchParams.get("approvalStatus") || "active";
    const userType = searchParams.get("userType"); // 'brand', 'vendor', or null for all
    const search = searchParams.get("search") || "";

    // Build filter query
    const filter: any = {
      userType: { $in: ["brand", "vendor"] }, // Only show brands and vendors
    };

    // Filter by adminApproval status
    if (approvalStatus === "active") {
      filter.adminApproval = true;
    } else if (approvalStatus === "inactive") {
      filter.adminApproval = false;
    }

    // Filter by specific user type if provided
    if (userType && (userType === "brand" || userType === "vendor")) {
      filter.userType = userType;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch users + total count in parallel, with short Redis cache
    const cacheKey = `admin:users:v1:${approvalStatus}:${userType || "all"}:${page}:${limit}:${search}`;
    const result = await apiCache(
      cacheKey,
      30, // 30s TTL — user list changes infrequently
      async () => {
        const [users, total] = await Promise.all([
          User.find(filter)
            .select(
              "name email phone userType adminApproval createdAt businessName gstNumber",
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          User.countDocuments(filter),
        ]);

        const transformedUsers = users.map((user: any) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          adminApproval: user.adminApproval,
          createdAt: user.createdAt,
          businessName: user.businessName,
          gstNumber: user.gstNumber,
        }));

        return {
          users: transformedUsers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 },
    );
  }
}
