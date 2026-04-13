import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import MasterRate from "@/lib/models/MasterRate";
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

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Verify user type is vendor
    const user = await User.findById(decoded.userId);
    if (!user || user.userType !== "vendor") {
      return NextResponse.json(
        { error: "Forbidden - Vendor access only" },
        { status: 403 }
      );
    }

    // Get search query from URL params
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("q") || "";

    if (!searchQuery || searchQuery.trim().length < 2) {
      return NextResponse.json(
        { data: [] },
        { status: 200 }
      );
    }

    // Search in labelName, uniqueKey, and description
    const masterRates = await MasterRate.find({
      isActive: true,
      $or: [
        { labelName: { $regex: searchQuery, $options: "i" } },
        { uniqueKey: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .select('labelName uniqueKey description rateType measurementUnit calculateUnit width height rate imageUrl')
      .limit(10)
      .sort({ labelName: 1 });

    return NextResponse.json(
      {
        message: "Master rates search completed",
        data: masterRates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Search master rates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search master rates" },
      { status: 500 }
    );
  }
}
