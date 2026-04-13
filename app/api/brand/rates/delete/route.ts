import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import BrandRate from "@/lib/models/BrandRate";
import connectDB from "@/lib/db/mongodb";

export async function PATCH(req: NextRequest) {
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

    const { rateId } = await req.json();

    // Validation
    if (!rateId) {
      return NextResponse.json(
        { error: "Rate ID is required" },
        { status: 400 }
      );
    }

    // Find the rate
    const existingRate = await BrandRate.findById(rateId);
    if (!existingRate) {
      return NextResponse.json(
        { error: "Rate not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingRate.createdId.toString() !== userId && existingRate.parentId.toString() !== userId) {
      return NextResponse.json(
        { error: "Access denied - You can only delete your own rates" },
        { status: 403 }
      );
    }

    // Soft delete - set isActive to false
    const deletedRate = await BrandRate.findByIdAndUpdate(
      rateId,
      { isActive: false },
      { new: true }
    );

    return NextResponse.json(
      {
        message: "Brand rate deleted successfully",
        data: deletedRate,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete brand rate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete brand rate" },
      { status: 500 }
    );
  }
}
