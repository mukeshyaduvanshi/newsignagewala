import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import connectDB from "@/lib/db/mongodb";
import { getStoresController } from "@/modules/brands/stores/stores.controller";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user || user.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search") || undefined;
    const storeIdParam = searchParams.get("storeId") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const result = await getStoresController(userId, {
      search: searchQuery,
      storeId: storeIdParam,
      limit,
    });

    const stores = (result as any).data ?? result;
    return NextResponse.json({ stores }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
