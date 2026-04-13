import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import Store from "@/lib/models/Store";
import Site from "@/lib/models/Site";
import Racee from "@/lib/models/Racee";

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

    // Get user counts using aggregation for efficiency
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          brand: { $sum: { $cond: [{ $eq: ["$userType", "brand"] }, 1, 0] } },
          vendor: { $sum: { $cond: [{ $eq: ["$userType", "vendor"] }, 1, 0] } },
          admin: { $sum: { $cond: [{ $eq: ["$userType", "admin"] }, 1, 0] } },
          manager: {
            $sum: { $cond: [{ $eq: ["$userType", "manager"] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = userStats[0] || {
      total: 0,
      brand: 0,
      vendor: 0,
      admin: 0,
      manager: 0,
    };
    const allUsersCount = stats.total - stats.admin;
    const brandCount = stats.brand;
    const vendorCount = stats.vendor;
    const adminCount = stats.admin;
    const managerCount = stats.manager;

    // Get counts for other collections in parallel
    const [storeCount, siteCount, raceeCount] = await Promise.all([
      Store.countDocuments({}),
      Site.countDocuments({}),
      Racee.countDocuments({ status: "pending" }),
    ]);

    return NextResponse.json(
      {
        message: "User count fetched successfully",
        data: {
          allUsersCount,
          brandCount,
          vendorCount,
          adminCount,
          managerCount,
          storeCount,
          siteCount,
          raceeCount,
        },
      },
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
