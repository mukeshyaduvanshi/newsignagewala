import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import Store from "@/lib/models/Store";
import connectDB from "@/lib/db/mongodb";

// Function to convert store name to camelCase
function generateUniqueKey(storeName: string): string {
  return storeName
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

    const {
      storeName,
      storePhone,
      storeAddress,
      storeCountry,
      storeState,
      storeCity,
      storePincode,
      storeImage,
    } = await req.json();

    // Validation
    if (!storeName || storeName.length < 2) {
      return NextResponse.json(
        { error: "Store name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!storePhone || !/^[0-9]{10}$/.test(storePhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    if (!storeAddress || storeAddress.length < 10) {
      return NextResponse.json(
        { error: "Address must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (!storeCountry) {
      return NextResponse.json(
        { error: "Country is required" },
        { status: 400 }
      );
    }

    if (!storeState) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }

    if (!storeCity) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }

    if (!storePincode || !/^[0-9]{6}$/.test(storePincode)) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit pincode" },
        { status: 400 }
      );
    }

    // Generate uniqueKey from storeName
    const uniqueKey = generateUniqueKey(storeName);

    // Check if uniqueKey already exists
    const existingStore = await Store.findOne({ uniqueKey, parentId: userId, isActive: true });
    if (existingStore) {
      return NextResponse.json(
        { error: "A store with this name already exists" },
        { status: 400 }
      );
    }

    // Create new store
    const newStore = new Store({
      storeName,
      uniqueKey,
      storePhone,
      storeAddress,
      storeCountry,
      storeState,
      storeCity,
      storePincode,
      storeImage: storeImage || "",
      createdId: userId,
      parentId: userId,
      isActive: true,
    });

    await newStore.save();

    return NextResponse.json(
      { message: "Store created successfully", store: newStore },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
