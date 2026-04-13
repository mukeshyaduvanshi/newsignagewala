import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import BrandRate from "@/lib/models/BrandRate";
import connectDB from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get manager authentication from JWT token
    const managerAuth = await requireManagerAuth(req);


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
        { status: 400 }
      );
    }

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (!rateType) {
      return NextResponse.json(
        { error: "Rate type is required" },
        { status: 400 }
      );
    }

    if (!measurementUnit) {
      return NextResponse.json(
        { error: "Measurement unit is required" },
        { status: 400 }
      );
    }

    if (!calculateUnit) {
      return NextResponse.json(
        { error: "Calculate unit is required" },
        { status: 400 }
      );
    }

    if (rate === undefined || rate === null || rate < 0) {
      return NextResponse.json(
        { error: "Valid rate is required" },
        { status: 400 }
      );
    }

    if (rateType === "fixed") {
      if (!width || width <= 0) {
        return NextResponse.json(
          { error: "Width is required for fixed rate type" },
          { status: 400 }
        );
      }
      if (!height || height <= 0) {
        return NextResponse.json(
          { error: "Height is required for fixed rate type" },
          { status: 400 }
        );
      }
    }

    // Determine if this is a new element
    // If no masterRateId → new custom element (true)
    // If masterRateId exists → check canEditDescription
    //   - canEditDescription true → new element (true)
    //   - canEditDescription false → using master as-is (false)
    const newElement = masterRateId ? canEditDescription : true;


    // Create brand rate
    const brandRate = await BrandRate.create({
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
      createdId: managerAuth.userId, // From JWT token
      parentId: managerAuth.parentId, // From JWT token
      isActive: true,
    });

    return NextResponse.json(
      {
        message: "Brand rate created successfully",
        data: brandRate,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create brand rate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create brand rate" },
      { status: error.status || 500 }
    );
  }
}
