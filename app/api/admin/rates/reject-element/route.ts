import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import BrandRate from "@/lib/models/BrandRate";
import VendorRate from "@/lib/models/VendorRate";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    const { requestId, source } = await request.json();

    if (!requestId || !source) {
      return NextResponse.json(
        { error: "Request ID and source are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update the rate based on source
    if (source === "brand") {
      await BrandRate.findByIdAndUpdate(requestId, {
        rateRejected: true,
        newElement: false,
      });
    } else if (source === "vendor") {
      await VendorRate.findByIdAndUpdate(requestId, {
        rateRejected: true,
        newElement: false,
      });
    } else {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Element request rejected",
    });
  } catch (error: any) {
    console.error("Error rejecting element:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject element" },
      { status: 500 }
    );
  }
}
