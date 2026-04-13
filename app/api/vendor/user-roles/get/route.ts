import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { getCachedUserRoles } from "@/lib/utils/sidebar-cache";

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
    const { data, source } = await getCachedUserRoles(
      userId, 
      'vendor',
      async () => {
        // This fetch function only runs on cache miss
        await connectDB();
        
        // Optimized MongoDB query with .lean() and field projection
        return await UserRole.find({
          $or: [
            { createdId: userId },
            { parentId: userId }
          ],
          isActive: true
        })
        .select('_id labelName uniqueKey description createdId parentId isActive isUsedInTeam createdAt updatedAt')
        .sort({ createdAt: -1 })
        .lean();
      }
    );

    return NextResponse.json(
      {
        message: `User roles fetched successfully (from ${source})`,
        data,
        source, // "redis" or "mongodb" (for debugging)
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get user role error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}
