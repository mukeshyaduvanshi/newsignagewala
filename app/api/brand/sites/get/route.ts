import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/mongodb";
import Site from "@/lib/models/Site";
import User from "@/lib/models/User";
import Store from "@/lib/models/Store";
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    // Verify token and get user ID
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    const userId = decoded.userId;

    // Verify user is brand
    const user = await User.findById(userId);
    if (!user || user.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 },
      );
    }

    // Get storeId from query params
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 },
      );
    }

    //fetch details of the store
    const store = await Store.findById(storeId);

    // Fetch sites for the store
    const sites = await Site.find({ storeId }).sort({ createdAt: -1 }).lean();

    const siteDetails = sites.map((site) => ({
      ...site,
      storeName: store?.storeName || "",
      storeId: store?._id || "",
      storeLocation: store?.storeLocation?.coordinates || [],
    }));
    // console.log(siteDetails);

    return NextResponse.json({ sites: siteDetails }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 },
    );
  }
}
