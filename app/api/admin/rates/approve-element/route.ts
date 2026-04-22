import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import BrandRate from "@/lib/models/BrandRate";
import MasterRate from "@/lib/models/MasterRate";
import VendorRate from "@/lib/models/VendorRate";
import { invalidateRatesCache } from "@/modules/admin/rates/rates.controller";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 401 },
      );
    }

    const { requestId, source } = await request.json();

    if (!requestId || !source) {
      return NextResponse.json(
        { error: "Request ID and source are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Get the rate based on source
    let rate;
    if (source === "brand") {
      rate = await BrandRate.findById(requestId);
    } else if (source === "vendor") {
      rate = await VendorRate.findById(requestId);
    } else {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    if (!rate) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 });
    }

    // Generate unique key from element name (camelCase)
    const words = rate.elementName.trim().split(/\s+/);
    const uniqueKey = words
      .map((word, index) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "");
        if (index === 0) {
          return cleanWord.toLowerCase();
        }
        return (
          cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase()
        );
      })
      .join("");

    // Check if uniqueKey already exists
    const existingMasterRate = await MasterRate.findOne({ uniqueKey });
    if (existingMasterRate) {
      return NextResponse.json(
        { error: "A master rate with this name already exists" },
        { status: 400 },
      );
    }

    // Create master rate
    const masterRate = await MasterRate.create({
      labelName: rate.elementName,
      uniqueKey,
      description: rate.description,
      rate: rate.rate,
      measurementUnit: rate.measurementUnit,
      calculateUnit: rate.calculateUnit,
      rateType: rate.rateType,
      width: rate.width,
      height: rate.height,
      imageUrl: rate.imageUrl,
      createdId: decoded.userId,
      parentId: decoded.userId,
      isActive: true,
      isUsedInRates: false,
    });

    // Update the original rate with uniqueKey and set newElement to false
    if (source === "brand") {
      await BrandRate.findByIdAndUpdate(requestId, {
        uniqueKey,
        newElement: false,
        masterRateId: masterRate._id,
      });
    } else if (source === "vendor") {
      await VendorRate.findByIdAndUpdate(requestId, {
        uniqueKey,
        newElement: false,
        masterRateId: masterRate._id,
      });
    }

    await invalidateRatesCache(decoded.userId).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Element approved and added to master rates",
      data: masterRate,
    });
  } catch (error: any) {
    console.error("Error approving element:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve element" },
      { status: 500 },
    );
  }
}
