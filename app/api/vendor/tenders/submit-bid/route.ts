import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import Tender from "@/lib/models/Tender";
import mongoose from "mongoose";
import {
  invalidateTendersCache,
  publishTendersUpdate,
} from "@/modules/vendor/tenders/tenders.controller";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    const { tenderId, amount, customRates, vendorCharges } =
      await request.json();

    if (!tenderId) {
      return NextResponse.json(
        { error: "Tender ID is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Find the tender
    const tender = await Tender.findById(tenderId);

    if (!tender) {
      return NextResponse.json({ error: "Tender not found" }, { status: 404 });
    }

    // Check if vendor has already submitted a bid
    const existingBid = tender.biddings?.find(
      (bid: any) => bid.vendorId.toString() === decoded.userId,
    );

    if (existingBid) {
      return NextResponse.json(
        { error: "You have already submitted a bid for this tender" },
        { status: 400 },
      );
    }

    // If amount is not provided, use tender's total amount
    const biddingAmount = amount || tender.total;

    // Add bidding to tender
    tender.biddings.push({
      vendorId: new mongoose.Types.ObjectId(decoded.userId),
      amount: biddingAmount,
      customRates: customRates || [],
      vendorCharges: vendorCharges || [],
      status: "submitted",
      submittedAt: new Date(),
    });

    await tender.save();

    await invalidateTendersCache(decoded.userId);
    await publishTendersUpdate(decoded.userId);

    return NextResponse.json(
      {
        message: "Bidding submitted successfully",
        bidding: {
          amount: biddingAmount,
          status: "submitted",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error submitting bidding:", error);
    return NextResponse.json(
      { error: "Failed to submit bidding" },
      { status: 500 },
    );
  }
}
