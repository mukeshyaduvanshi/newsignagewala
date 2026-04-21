import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import MasterRate from "@/lib/models/MasterRate";
import BrandRate from "@/lib/models/BrandRate";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import { invalidateRatesCache } from "@/modules/admin/rates/rates.controller";

// Function to convert label name to camelCase
function generateUniqueKey(labelName: string): string {
  return labelName
    .trim()
    .split(/\s+/) // Split by one or more spaces
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

export async function PUT(req: NextRequest) {
  try {
    // Extract and verify token
    const token = extractBearerToken(req.headers.get("authorization"));

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    await connectDB();

    // Verify user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.userType !== "admin") {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      id,
      labelName,
      description,
      rate,
      measurementUnit,
      calculateUnit,
      rateType,
      width,
      height,
      imageUrl,
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Master rate ID is required" },
        { status: 400 },
      );
    }

    if (!labelName || labelName.length < 2) {
      return NextResponse.json(
        { error: "Label name must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters" },
        { status: 400 },
      );
    }

    if (rate === undefined || rate === null || rate < 0) {
      return NextResponse.json(
        { error: "Valid rate is required" },
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

    if (!rateType) {
      return NextResponse.json(
        { error: "Rate type is required" },
        { status: 400 },
      );
    }

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

    // Find the master rate
    const existingRate = await MasterRate.findById(id);

    if (!existingRate) {
      return NextResponse.json(
        { error: "Master rate not found" },
        { status: 404 },
      );
    }

    // Admin can only update their own master rates
    if (existingRate.createdId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only update your own master rates" },
        { status: 403 },
      );
    }

    // Generate uniqueKey from labelName
    const uniqueKey = generateUniqueKey(labelName);

    // Check if uniqueKey already exists (excluding current document)
    const duplicateKey = await MasterRate.findOne({
      uniqueKey,
      _id: { $ne: id },
    });

    if (duplicateKey) {
      return NextResponse.json(
        {
          error: `Unique key "${uniqueKey}" already exists. Please use a different label name.`,
        },
        { status: 400 },
      );
    }

    // Get old uniqueKey before updating
    const oldUniqueKey = existingRate.uniqueKey;

    // Update the master rate
    const updatedRate = await MasterRate.findByIdAndUpdate(
      id,
      {
        labelName,
        uniqueKey,
        description,
        rate,
        measurementUnit,
        calculateUnit,
        rateType,
        width: rateType === "fixed" ? width : undefined,
        height: rateType === "fixed" ? height : undefined,
        imageUrl: imageUrl || undefined,
      },
      { new: true },
    );

    // Update all BrandRates that use this uniqueKey
    if (oldUniqueKey) {
      const updateData: any = {
        description,
        labelName,
        uniqueKey,
        rateType,
        measurementUnit,
        calculateUnit,
        imageUrl: imageUrl || undefined,
        width: rateType === "fixed" ? width : undefined,
        height: rateType === "fixed" ? height : undefined,
      };

      // If rateType is fixed, also update width and height
      if (rateType === "fixed" && width && height) {
        updateData.width = width;
        updateData.height = height;
      }

      // Update all matching BrandRates
      const brandUpdateResult = await BrandRate.updateMany(
        { uniqueKey: oldUniqueKey, isActive: true },
        { $set: updateData },
      );

      console.log(
        `Updated ${brandUpdateResult.modifiedCount} brand rates with uniqueKey: ${oldUniqueKey}`,
      );
    }

    await invalidateRatesCache(decoded.userId).catch(() => {});

    return NextResponse.json(
      {
        message: "Master rate updated successfully",
        data: updatedRate,
        brandRatesUpdated: oldUniqueKey ? true : false,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating master rate:", error);
    // Handle MongoDB duplicate key error
    if (error.code === 11000 || error.message?.includes("duplicate key")) {
      return NextResponse.json(
        {
          error:
            "This element already exists. Please use a different label name.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error.message || "Element Already Exists" },
      { status: 500 },
    );
  }
}
