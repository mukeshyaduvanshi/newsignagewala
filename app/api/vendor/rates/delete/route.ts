import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import VendorRate from "@/lib/models/VendorRate";
import connectDB from "@/lib/db/mongodb";
import { invalidateRatesCache } from "@/modules/vendor/rates/rates.controller";

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

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

    // Verify user is vendor
    const user = await User.findById(userId);
    if (!user || user.userType !== "vendor") {
      return NextResponse.json(
        { error: "Access denied - Vendor only" },
        { status: 403 },
      );
    }

    const { rateId } = await req.json();

    // Validation
    if (!rateId) {
      return NextResponse.json(
        { error: "Rate ID is required" },
        { status: 400 },
      );
    }

    // Find the rate
    const existingRate = await VendorRate.findById(rateId);
    if (!existingRate) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 });
    }

    // Check ownership
    if (
      existingRate.createdId.toString() !== userId &&
      existingRate.parentId.toString() !== userId
    ) {
      return NextResponse.json(
        { error: "Access denied - You can only delete your own rates" },
        { status: 403 },
      );
    }

    // Soft delete - set isActive to false
    const deletedRate = await VendorRate.findByIdAndUpdate(
      rateId,
      { isActive: false },
      { new: true },
    );

    await invalidateRatesCache(userId);

    return NextResponse.json(
      {
        message: "Vendor rate deleted successfully",
        data: deletedRate,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Delete vendor rate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete vendor rate" },
      { status: 500 },
    );
  }
}
