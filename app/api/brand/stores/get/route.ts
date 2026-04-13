import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import Store from "@/lib/models/Store";
import connectDB from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
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

    // Get search query from URL params
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get('search');
    const storeIdParam = searchParams.get('storeId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Build query object
    const query: any = {
      parentId: userId,
      isActive: true,
    };

    // If storeId is provided, filter by specific store
    if (storeIdParam && storeIdParam.trim()) {
      query._id = storeIdParam.trim();
    }

    // If search query exists, add search conditions
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i'); // Case-insensitive search
      query.$or = [
        { storeName: searchRegex },
        { storePhone: searchRegex },
        { storeAddress: searchRegex },
        { storeCity: searchRegex },
        { storeState: searchRegex },
        { storeCountry: searchRegex },
        { storePincode: searchRegex },
      ];
    }

    // Get stores with optional limit
    let storesQuery = Store.find(query).sort({ createdAt: -1 });
    
    if (limit && limit > 0) {
      storesQuery = storesQuery.limit(limit);
    }
    
    const stores = await storesQuery;

    return NextResponse.json({ stores }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
