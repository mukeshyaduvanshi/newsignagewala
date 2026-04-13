import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import MasterRate from "@/lib/models/MasterRate";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";

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
    .join('');
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get access token from Authorization header
    const authHeader = req.headers.get('authorization');
    const accessToken = extractBearerToken(authHeader);
    
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

    // Verify user is admin
    const user = await User.findById(userId);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 }
      );
    }

    const { labelName, description, rate, measurementUnit, calculateUnit, rateType, width, height, imageUrl } = await req.json();

    // Validation
    if (!labelName) {
      return NextResponse.json(
        { error: "Label name is required" },
        { status: 400 }
      );
    }

    if (labelName.length < 2) {
      return NextResponse.json(
        { error: "Label name must be at least 2 characters long" },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters long" },
        { status: 400 }
      );
    }

    if (rate === undefined || rate === null) {
      return NextResponse.json(
        { error: "Rate is required" },
        { status: 400 }
      );
    }

    if (rate < 0) {
      return NextResponse.json(
        { error: "Rate must be a positive number" },
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

    if (!rateType) {
      return NextResponse.json(
        { error: "Rate type is required" },
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

    // Generate uniqueKey from labelName
    const uniqueKey = generateUniqueKey(labelName);

    // Check if uniqueKey already exists
    const duplicateKey = await MasterRate.findOne({ uniqueKey });

    if (duplicateKey) {
      return NextResponse.json(
        { error: `This element already exists with the name "${duplicateKey.labelName}". Please use a different label name.` },
        { status: 400 }
      );
    }

    // Create master rate with admin's userId
    const masterRate = await MasterRate.create({
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
      createdId: userId,
      parentId: userId,
      isActive: true,
      isUsedInRates: false,
    });

    return NextResponse.json(
      {
        message: "Master rate created successfully",
        data: masterRate,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create master rate error:", error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000 || error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: "This element already exists. Please use a different label name." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create master rate" },
      { status: 500 }
    );
  }
}
