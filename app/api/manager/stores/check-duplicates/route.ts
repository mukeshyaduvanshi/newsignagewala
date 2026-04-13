import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import connectDB from "@/lib/db/mongodb";
import Store from "@/lib/models/Store";

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

    // Check for existing stores (name + address combination with same parentId)
    const existingStores = new Set<string>();

    for (const store of stores) {
      const key = `${store.storeName.toLowerCase().trim()}-${store.storeAddress.toLowerCase().trim()}`;
      const exists = await Store.findOne({
        parentId: managerAuth.parentId, // From JWT token
        storeName: new RegExp(`^${store.storeName}$`, 'i'),
        storeAddress: new RegExp(`^${store.storeAddress}$`, 'i'),
      });

      if (exists) {
        existingStores.add(key);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        existingStores: Array.from(existingStores),
      },
    });
  } catch (error: any) {
    console.error("Error checking duplicates:", error);
    return NextResponse.json(
      { error: "Failed to check duplicates", details: error.message },
      { status: 500 }
    );
  }
}
