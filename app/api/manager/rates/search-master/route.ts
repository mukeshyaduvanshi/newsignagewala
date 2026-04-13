import { NextRequest, NextResponse } from "next/server";
import { getManagerAuth } from "@/lib/auth/manager-auth";
import MasterRate from "@/lib/models/MasterRate";
import connectDB from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const managerAuth = await getManagerAuth(req);
    if (!managerAuth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
      { status: error.status || 500 }
    );
  }
}
