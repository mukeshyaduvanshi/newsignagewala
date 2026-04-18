import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import BrandRate from "@/lib/models/BrandRate";
import connectDB from "@/lib/db/mongodb";
import { invalidateRatesCache } from "@/modules/brands/rates/rates.controller";

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

    // Verify user is brand
    const user = await User.findById(userId);
    if (!user || user.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
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
    const existingRate = await BrandRate.findById(rateId);
    if (!existingRate) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 });
    }

    // Check ownership
    if (
      existingRate.createdId.toString() !== userId &&
      existingRate.parentId.toString() !== userId
    ) {
      return NextResponse.json(
        { error: "Access denied - You can only edit your own rates" },
        { status: 403 },
      );
    }

    // Validation for fixed type
    if (rateType === "fixed") {
      if (!width || width <= 0 || !height || height <= 0) {
        return NextResponse.json(
          { error: "Valid width and height are required for fixed rate type" },
          { status: 400 },
        );
      }
    }

    // Update rate (elementName and description cannot be changed)
    // If original rateType was fixed, width and height cannot be changed
    const updateData: any = {
      rateType,
      measurementUnit,
      calculateUnit,
      rate,
      instruction: instruction || undefined,
    };

    // Only allow width/height updates if original rateType was not fixed
    if (existingRate.rateType !== "fixed") {
      updateData.width = width || undefined;
      updateData.height = height || undefined;
    }

    const updatedRate = await BrandRate.findByIdAndUpdate(rateId, updateData, {
      new: true,
      runValidators: true,
    });

    await invalidateRatesCache(decoded.userId).catch(() => {});
    return NextResponse.json(
      {
        message: "Brand rate updated successfully",
        data: updatedRate,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Update brand rate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update brand rate" },
      { status: 500 },
    );
  }
}
