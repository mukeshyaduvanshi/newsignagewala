import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/mongodb";
import Store from "@/lib/models/Store";

export async function POST(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

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
        parentId: decoded.userId,
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
