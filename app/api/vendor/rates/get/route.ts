import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import VendorRate from "@/lib/models/VendorRate";
import connectDB from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Verify user is vendor
    const user = await User.findById(userId);
    if (!user || user.userType !== 'vendor') {
      return NextResponse.json(
        { error: "Access denied - Vendor only" },
        { status: 403 }
      );
    }

    // Fetch vendor rates created by this vendor or their parent
    const vendorRates = await VendorRate.find({
      $or: [
        { createdId: userId },
        { parentId: userId }
      ],
      isActive: true,
    })
      .select('-__v')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: "Vendor rates fetched successfully",
        data: vendorRates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fetch vendor rates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vendor rates" },
      { status: 500 }
    );
  }
}
