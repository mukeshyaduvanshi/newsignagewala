import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import Store from "@/lib/models/Store";
import Site from "@/lib/models/Site";
import Racee from "@/lib/models/Racee";
import { apiCache } from "@/lib/cache/with-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get access token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    // Verify token and get user ID
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    const userId = decoded.userId;

    // Verify user is admin
    const user = await User.findById(userId);
    if (!user || user.userType !== "admin") {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 },
      );
    }

    // Fetch all stats via Redis cache (60s TTL — dashboard stats don't need to be real-time)
    const statsData = await apiCache("admin:stats:v1", 60, async () => {
      const [userStats, storeCount, siteCount, raceeCount] = await Promise.all([
        User.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              brand: {
                $sum: { $cond: [{ $eq: ["$userType", "brand"] }, 1, 0] },
              },
              vendor: {
                $sum: { $cond: [{ $eq: ["$userType", "vendor"] }, 1, 0] },
              },
              admin: {
                $sum: { $cond: [{ $eq: ["$userType", "admin"] }, 1, 0] },
              },
              manager: {
                $sum: { $cond: [{ $eq: ["$userType", "manager"] }, 1, 0] },
              },
            },
          },
        ]),
        Store.countDocuments({}),
        Site.countDocuments({}),
        Racee.countDocuments({ status: "pending" }),
      ]);

      const s = userStats[0] || {
        total: 0,
        brand: 0,
        vendor: 0,
        admin: 0,
        manager: 0,
      };
      return {
        allUsersCount: s.total - s.admin,
        brandCount: s.brand,
        vendorCount: s.vendor,
        adminCount: s.admin,
        managerCount: s.manager,
        storeCount,
        siteCount,
        raceeCount,
      };
    });

    return NextResponse.json(
      { message: "User count fetched successfully", data: statsData },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Get user counts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user counts" },
      { status: 500 },
    );
  }
}
