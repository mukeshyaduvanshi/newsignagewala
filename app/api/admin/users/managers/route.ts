import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";

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
        { status: 401 }
      );
    }

    await dbConnect();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const approvalStatus = searchParams.get("approvalStatus") || "active";
    const search = searchParams.get("search") || "";

    // Build filter query - only managers
    const filter: any = {
      userType: "manager",
    };

    // Filter by adminApproval status
    if (approvalStatus === "active") {
      filter.adminApproval = true;
    } else if (approvalStatus === "inactive") {
      filter.adminApproval = false;
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

    // Fetch managers with pagination
    const managers = await User.find(filter)
      .select("-password") // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Transform managers data
    const transformedManagers = managers.map((manager: any) => ({
      id: manager._id.toString(),
      name: manager.name,
      email: manager.email,
      phone: manager.phone,
      userType: manager.userType,
      adminApproval: manager.adminApproval,
      createdAt: manager.createdAt,
      businessName: "-", // Managers don't have business details
      gstNumber: "-",
    }));

    return NextResponse.json(
      {
        users: transformedManagers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching managers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch managers" },
      { status: 500 }
    );
  }
}
