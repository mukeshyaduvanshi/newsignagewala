import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized - Brand access only" },
        { status: 403 },
      );
    }

    const brandId = decoded.userId;
    const body = await request.json();
    const {
      orderId,
      siteChanges,
      additionalChargeChanges,
      oldTotal,
      newTotal,
      reason,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Find the order and verify brand ownership
    await dbConnect();
    const order = await Order.findById(orderId).populate(
      "brandId",
      "companyName email phone",
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify brand owns this order
    if (
      order.brandId?._id?.toString() !== brandId &&
      order.brandId?.toString() !== brandId
    ) {
      return NextResponse.json(
        { error: "Unauthorized - This order is not assigned to you" },
        { status: 403 },
      );
    }

    // Check if order status is "escalation"
    if (order.orderStatus !== "escalation") {
      return NextResponse.json(
        { error: "Can only respond to escalated orders" },
        { status: 400 },
      );
    }

    // Create escalation record
    const escalationRecord = {
      raisedAt: new Date(),
      raisedBy: new mongoose.Types.ObjectId(brandId),
      userType: "brand" as "brand",
      siteChanges: siteChanges || [],
      additionalChargeChanges: additionalChargeChanges || [],
      oldTotal: oldTotal || 0,
      newTotal: newTotal || 0,
      totalDifference: (newTotal || 0) - (oldTotal || 0),
      reason: reason || "Brand counter-offer",
      status: "pending" as "pending",
    };

    // Initialize priceEscalation array if it doesn't exist
    if (!order.priceEscalation) {
      order.priceEscalation = [];
    }

    // Add escalation to array
    order.priceEscalation.push(escalationRecord);

    // Normalize legacy 'complete' status value
    if ((order.orderStatus as string) === "complete") {
      order.orderStatus = "completed";
    }

    // Save the order
    await order.save();

    return NextResponse.json({
      success: true,
      message: "Brand response submitted successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        priceEscalation: order.priceEscalation,
      },
    });
  } catch (error) {
    console.error("Error responding to escalation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
