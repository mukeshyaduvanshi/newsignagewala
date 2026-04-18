import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import VendorRate from "@/lib/models/VendorRate";
import connectDB from "@/lib/db/mongodb";
import { invalidateRatesCache } from "@/modules/vendor/rates/rates.controller";

export async function POST(req: NextRequest) {
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
      elementName,
      uniqueKey,
      description,
      rateType,
      measurementUnit,
      calculateUnit,
      width,
      height,
      rate,
      imageUrl,
      instruction,
      canEditDescription,
      masterRateId,
    } = await req.json();

    // Validation
    if (!elementName || elementName.length < 2) {
      return NextResponse.json(
        { error: "Element name must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters" },
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

    // Determine if this is a new element
    const newElement = masterRateId ? canEditDescription : true;

    // Create vendor rate
    const vendorRate = await VendorRate.create({
      elementName,
      uniqueKey: uniqueKey || undefined,
      description,
      rateType,
      measurementUnit,
      calculateUnit,
      width: width || undefined,
      height: height || undefined,
      rate,
      instruction: instruction || undefined,
      canEditDescription: canEditDescription || false,
      masterRateId: masterRateId || undefined,
      newElement,
      imageUrl: imageUrl || undefined,
      createdId: userId,
      parentId: userId,
      isActive: true,
    });

    await invalidateRatesCache(userId);

    return NextResponse.json(
      {
        message: "Vendor rate created successfully",
        data: vendorRate,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create vendor rate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create vendor rate" },
      { status: 500 },
    );
  }
}
