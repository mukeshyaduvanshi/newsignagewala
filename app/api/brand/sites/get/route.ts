import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import { getSitesController } from "@/modules/brands/sites/sites.controller";
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
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 },
      );
    }

    const result = await getSitesController(storeId);
    const sites = (result as any).data ?? result;

    return NextResponse.json({ sites }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 },
    );
  }
}
