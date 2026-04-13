import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import User from "@/lib/models/User";
import Store from "@/lib/models/Store";
import connectDB from "@/lib/db/mongodb";
import StoreAssignManager from "@/lib/models/StoreAssignManager";
import TeamMember from "@/lib/models/TeamMember";

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

    // Get manager auth data from JWT token (includes parentId and uniqueKey)
    const managerAuth = await requireManagerAuth(req);

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
    const storeUniqueKey = generateUniqueKey(storeName);

    // Check if uniqueKey already exists for this brand
    const existingStore = await Store.findOne({
      uniqueKey: storeUniqueKey,
      parentId: managerAuth.parentId, // From JWT token
      isActive: true
    });
    if (existingStore) {
      return NextResponse.json(
        { error: "A store with this name already exists" },
        { status: 400 }
      );
    }

    // Get TeamMember details for StoreAssignManager
    const teamMember = await TeamMember.findOne({
      userId: managerAuth.userId,
      parentId: managerAuth.parentId,
      uniqueKey: managerAuth.uniqueKey,
      status: 'active'
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Create new store
    const newStore = new Store({
      storeName,
      uniqueKey: storeUniqueKey,
      storePhone,
      storeAddress,
      storeCountry,
      storeState,
      storeCity,
      storePincode,
      storeImage: storeImage || "",
      createdId: managerAuth.userId,
      parentId: managerAuth.parentId, // From JWT token
      isActive: true,
    });

    await newStore.save();

    // Create a New Entry in the Database collection storeassignmanagers for assigning managers
    const newStoreAssignManager = new StoreAssignManager({
      storeId: newStore._id,
      teamId: teamMember._id,
      parentId: managerAuth.parentId, // From JWT token
      managerUserId: managerAuth.userId,
      isStoreUsed: false,
    });

    await newStoreAssignManager.save();



    return NextResponse.json(
      { message: "Store created successfully", store: newStore },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: error.status || 500 }
    );
  }
}
