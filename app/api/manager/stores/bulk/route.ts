import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import connectDB from "@/lib/db/mongodb";
import Store from "@/lib/models/Store";
import { generateUniqueKey } from "@/lib/utils/generateUniqueKey";
import StoreAssignManager from "@/lib/models/StoreAssignManager";
import TeamMember from "@/lib/models/TeamMember";

export async function POST(req: NextRequest) {
  try {
    // Get manager authentication from JWT token
    const managerAuth = await requireManagerAuth(req);

    await connectDB();

    const { stores } = await req.json();

    if (!stores || !Array.isArray(stores) || stores.length === 0) {
      return NextResponse.json(
        { error: "No stores provided" },
        { status: 400 }
      );
    }

    if (stores.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 stores allowed per upload" },
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

    const createdStores = [];
    const errors = [];

    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];

      try {
        // Check if store already exists (name + address)
        const existingStore = await Store.findOne({
          parentId: managerAuth.parentId, // From JWT token
          storeName: new RegExp(`^${store.storeName}$`, 'i'),
          storeAddress: new RegExp(`^${store.storeAddress}$`, 'i'),
        });

        if (existingStore) {
          errors.push({
            index: i,
            storeName: store.storeName,
            error: "Store already exists",
          });
          continue;
        }

        // Generate unique key for store
        const uniqueKey = generateUniqueKey(store.storeName, store.storePincode, managerAuth.parentId.toString());

        // Create new store
        const newStore = await Store.create({
          parentId: managerAuth.parentId, // From JWT token
          createdId: managerAuth.userId, // From JWT token
          storeName: store.storeName,
          storeAddress: store.storeAddress,
          storePhone: store.storePhone || "",
          storePincode: store.storePincode,
          storeCity: store.storeCity,
          storeState: store.storeState,
          storeCountry: store.storeCountry || "India",
          uniqueKey: uniqueKey,
        });

        createdStores.push(newStore);

        // Create a New Entry in the Database collection storeassignmanagers for assigning managers
        const newStoreAssignManager = new StoreAssignManager({
          storeId: newStore._id,
          teamId: teamMember._id,
          parentId: managerAuth.parentId, // From JWT token
          managerUserId: managerAuth.userId, // From JWT token
          isStoreUsed: false,
        });

        await newStoreAssignManager.save();
      } catch (error: any) {
        console.error(`Error creating store ${i}:`, error);
        errors.push({
          index: i,
          storeName: store.storeName,
          error: error.message || "Failed to create store",
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully created ${createdStores.length} stores`,
        data: {
          created: createdStores.length,
          failed: errors.length,
          stores: createdStores,
          errors: errors,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error bulk creating stores:", error);
    return NextResponse.json(
      { error: "Failed to create stores", details: error.message },
      { status: error.status || 500 }
    );
  }
}
