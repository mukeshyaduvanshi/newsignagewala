import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import Tender from "@/lib/models/Tender";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const { tenderId } = await request.json();

    if (!tenderId) {
      return NextResponse.json(
        { error: "Tender ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the tender
    const tender = await Tender.findById(tenderId);

    if (!tender) {
      return NextResponse.json(
        { error: "Tender not found" },
        { status: 404 }
      );
    }

    // Check if vendor has already submitted a bid
    const existingBid = tender.biddings?.find(
      (bid: any) => bid.vendorId.toString() === decoded.userId
    );

    if (existingBid) {
      return NextResponse.json(
        { error: "You have already taken action on this tender" },
        { status: 400 }
      );
    }

    // Add rejected bidding to tender
    tender.biddings.push({
      vendorId: new mongoose.Types.ObjectId(decoded.userId),
      status: "rejected",
      submittedAt: new Date(),
    });

    await tender.save();

    return NextResponse.json(
      { 
        message: "Bidding rejected successfully",
        bidding: {
          status: "rejected"
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error rejecting bidding:", error);
    return NextResponse.json(
      { error: "Failed to reject bidding" },
      { status: 500 }
    );
  }
}
