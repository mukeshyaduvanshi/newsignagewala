import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import StoreAuthority from "@/lib/models/StoreAuthority";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { invalidateStoreAuthorityCache } from "@/lib/utils/sidebar-cache";

// Function to convert option to camelCase uniqueKey
function generateUniqueKey(option: string): string {
  return option
    .trim()
    .split(/\s+/)
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
    const { selectedOptions } = await req.json();

    // Validation
    if (!selectedOptions || !Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      return NextResponse.json(
        { error: "At least one option must be selected" },
        { status: 400 }
      );
    }

    // Generate uniqueKeys from selectedOptions
    const uniqueKeys = selectedOptions.map(option => generateUniqueKey(option));

    // Create store authority with createdId from token
    const storeAuthority = await StoreAuthority.create({
      selectedOptions,
      uniqueKeys,
      createdId: userId,
      parentId: userId,
      isActive: true,
      isUsedInStore: false,
    });

    // 🔥 INVALIDATE CACHE - Force refetch on next request
    await invalidateStoreAuthorityCache(userId);

    return NextResponse.json(
      {
        message: "Store authority created successfully",
        data: storeAuthority,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create store authority error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create store authority" },
      { status: 500 }
    );
  }
}
