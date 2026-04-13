import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import BrandRate from "@/lib/models/BrandRate";
import MasterRate from "@/lib/models/MasterRate";
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

    // Verify user is brand
    const user = await User.findById(userId);
    if (!user || user.userType !== 'brand') {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 }
      );
    }

    // Fetch brand rates created by this brand or their parent
    const brandRates = await BrandRate.find({
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
        message: "Brand rates fetched successfully",
        data: brandRates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fetch brand rates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch brand rates" },
      { status: 500 }
    );
  }
}
