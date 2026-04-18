import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import VendorRate from "@/lib/models/VendorRate";
import connectDB from "@/lib/db/mongodb";
import { invalidateRatesCache } from "@/modules/vendor/rates/rates.controller";

export async function PUT(req: NextRequest) {
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

    const {
      rateId,
      rateType,
      measurementUnit,
      calculateUnit,
      width,
      height,
      rate,
      instruction,
    } = await req.json();

    // Validation
    if (!rateId) {
      return NextResponse.json(
        { error: "Rate ID is required" },
        { status: 400 },
      );
    }

    if (!rateType) {
      return NextResponse.json(
        { error: "Rate type is required" },
        { status: 400 },
      );
    }

    if (!measurementUnit) {
      return NextResponse.json(
        { error: "Measurement unit is required" },
        { status: 400 },
      );
    }

    if (!calculateUnit) {
      return NextResponse.json(
        { error: "Calculate unit is required" },
        { status: 400 },
      );
    }

    if (rate === undefined || rate === null || rate < 0) {
      return NextResponse.json(
        { error: "Valid rate is required" },
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
        { error: "Unauthorized to edit this rate" },
        { status: 403 },
      );
    }

    // Check if rate type is fixed and validate width/height
    if (rateType === "fixed") {
      if (!width || width <= 0) {
        return NextResponse.json(
          { error: "Width is required for fixed rate type" },
          { status: 400 },
        );
      }
      if (!height || height <= 0) {
        return NextResponse.json(
          { error: "Height is required for fixed rate type" },
          { status: 400 },
        );
      }
    }

    // Update the rate
    const updatedRate = await VendorRate.findByIdAndUpdate(
      rateId,
      {
        rateType,
        measurementUnit,
        calculateUnit,
        width: width || undefined,
        height: height || undefined,
        rate,
        instruction: instruction || undefined,
      },
      { new: true, runValidators: true },
    );

    await invalidateRatesCache(userId);

    return NextResponse.json(
      {
        message: "Vendor rate updated successfully",
        data: updatedRate,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Update vendor rate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update vendor rate" },
      { status: 500 },
    );
  }
}
