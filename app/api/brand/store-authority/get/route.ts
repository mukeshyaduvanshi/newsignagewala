import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import StoreAuthority from "@/lib/models/StoreAuthority";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { getCachedStoreAuthority } from "@/lib/utils/sidebar-cache";

export async function GET(req: NextRequest) {
  try {
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

    // Use getOrSetCache pattern - automatically handles Redis + MongoDB
    const { data, source } = await getCachedStoreAuthority(
      userId,
      async () => {
        // This fetch function only runs on cache miss
        await connectDB();
        
        // Optimized MongoDB query with .lean() and field projection
        return await StoreAuthority.find({
          $or: [
            { createdId: userId },
            { parentId: userId }
          ],
          isActive: true
        })
        .select('_id storeId storeName storeAddress createdId parentId createdAt updatedAt') // Only essential fields
        .sort({ createdAt: -1 })
        .lean();
      }
    );

    return NextResponse.json(
      {
        message: `Store authorities fetched successfully (from ${source})`,
        data,
        source, // "redis" or "mongodb" (for debugging)
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get store authority error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch store authorities" },
      { status: 500 }
    );
  }
}
