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

export async function PUT(req: NextRequest) {
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
      _id,
      storeName,
      storePhone,
      storeAddress,
      storeCountry,
      storeState,
      storeCity,
      storePincode,
      storeImage,
    } = await req.json();

    if (!_id) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

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

    // Find and update store
    const store = await Store.findOne({
      _id,
      parentId: userId,
      isActive: true,
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Check if store name changed and generate new uniqueKey
    const newUniqueKey = generateUniqueKey(storeName);
    if (store.storeName !== storeName) {
      // Check if new uniqueKey already exists (excluding current store)
      const existingStore = await Store.findOne({ 
        uniqueKey: newUniqueKey, 
        parentId: userId, 
        isActive: true,
        _id: { $ne: _id }
      });
      
      if (existingStore) {
        return NextResponse.json(
          { error: "A store with this name already exists" },
          { status: 400 }
        );
      }
      store.uniqueKey = newUniqueKey;
    }

    // Update store fields
    store.storeName = storeName;
    store.storePhone = storePhone;
    store.storeAddress = storeAddress;
    store.storeCountry = storeCountry;
    store.storeState = storeState;
    store.storeCity = storeCity;
    store.storePincode = storePincode;
    if (storeImage !== undefined) {
      store.storeImage = storeImage;
    }

    await store.save();

    return NextResponse.json(
      { message: "Store updated successfully", store },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
