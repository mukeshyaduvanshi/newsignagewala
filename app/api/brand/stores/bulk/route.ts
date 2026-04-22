import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/mongodb";
import Store from "@/lib/models/Store";
import { generateUniqueKey } from "@/lib/utils/generateUniqueKey";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys } from "@/lib/utils/brand-cache-keys";

export async function POST(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    await connectDB();

    const { stores } = await req.json();

    if (!stores || !Array.isArray(stores) || stores.length === 0) {
      return NextResponse.json(
        { error: "No stores provided" },
        { status: 400 },
      );
    }

    if (stores.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 stores allowed per upload" },
        { status: 400 },
      );
    }

    const createdStores = [];
    const errors = [];

    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];

      try {
        // Check if store already exists (name OR address OR pincode)
        const existingStore = await Store.findOne({
          parentId: decoded.userId,
          $and: [
            { storeName: new RegExp(`^${store.storeName}$`, "i") },
            { storeAddress: new RegExp(`^${store.storeAddress}$`, "i") },
            { storePincode: store.storePincode },
          ],
        });

        if (existingStore) {
          let matchFields = [];
          if (
            existingStore.storeName.toLowerCase() ===
            store.storeName.toLowerCase()
          )
            matchFields.push("storeName");
          if (
            existingStore.storeAddress.toLowerCase() ===
            store.storeAddress.toLowerCase()
          )
            matchFields.push("storeAddress");
          if (existingStore.storePincode === store.storePincode)
            matchFields.push("storePincode");
          errors.push({
            index: i,
            storeName: store.storeName,
            storeAddress: store.storeAddress,
            storePincode: store.storePincode,
            error: `Store already exists (matched: ${matchFields.join(", ")})`,
          });
          continue;
        }

        // Generate unique key for store
        // const uniqueKey = generateUniqueKey(`${store.storeName}-${store.storePincode}-${decoded.userId}`);
        const uniqueKey = generateUniqueKey(
          store.storeName,
          store.storePincode,
          decoded.userId,
        );

        // Create new store
        const newStore = await Store.create({
          parentId: decoded.userId,
          createdId: decoded.userId,
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
      } catch (error: any) {
        console.error(`Error creating store ${i}:`, error);
        errors.push({
          index: i,
          storeName: store.storeName,
          error: error.message || "Failed to create store",
        });
      }
    }

    // Clear brand store cache so the new stores are visible immediately
    if (createdStores.length > 0) {
      await RedisCache.del(BrandCacheKeys.stores(decoded.userId)).catch(
        () => {},
      );
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
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error bulk creating stores:", error);
    return NextResponse.json(
      { error: "Failed to create stores", details: error.message },
      { status: 500 },
    );
  }
}
