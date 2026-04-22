import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import { verifyAccessToken } from "@/lib/auth/jwt";
import {
  invalidateOrdersCache,
  publishOrdersUpdate,
} from "@/modules/vendor/orders/orders.controller";
import {
  invalidateBrandOrdersCache,
  invalidateManagerOrdersCacheByCreativeId,
} from "@/modules/manager/cache-invalidation";

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

    if (!decoded || decoded.userType !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized - Vendor access only" },
        { status: 403 },
      );
    }

    const vendorId = decoded.userId;
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

    // Find the order and verify vendor ownership
    await dbConnect();
    const order = await Order.findById(orderId).populate(
      "brandId",
      "companyName email phone",
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify vendor owns this order
    if (order.vendorId?.toString() !== vendorId) {
      return NextResponse.json(
        { error: "Unauthorized - This order is not assigned to you" },
        { status: 403 },
      );
    }

    // Check if order status allows escalation
    const escalatableStatuses = [
      "new",
      "accepted",
      "creativeAdapted",
      "creativeaddepted",
      "escalation",
    ];
    if (!escalatableStatuses.includes(order.orderStatus)) {
      return NextResponse.json(
        {
          error:
            "Can only raise escalation for new or pending escalation orders",
        },
        { status: 400 },
      );
    }

    // Create escalation record
    const escalationRecord = {
      raisedAt: new Date(),
      raisedBy: new mongoose.Types.ObjectId(vendorId),
      userType: "vendor" as const,
      siteChanges: siteChanges || [],
      additionalChargeChanges: additionalChargeChanges || [],
      oldTotal,
      newTotal,
      totalDifference: newTotal - oldTotal,
      reason: reason || "Price adjustment requested",
      status: "pending" as const,
    };

    // Initialize priceEscalation array if it doesn't exist
    if (!order.priceEscalation) {
      order.priceEscalation = [];
    }

    // Add escalation to array
    order.priceEscalation.push(escalationRecord);

    // Update order status to "escalation"
    order.orderStatus = "escalation";

    // Save the order
    await order.save();

    await invalidateOrdersCache(decoded.userId);
    await invalidateBrandOrdersCache(order.brandId?.toString());
    await invalidateManagerOrdersCacheByCreativeId(
      order.creativeManagerId?.toString(),
    ).catch(() => {});
    await publishOrdersUpdate(decoded.userId);

    return NextResponse.json({
      success: true,
      message: "Price escalation raised successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        priceEscalation: order.priceEscalation,
      },
    });
  } catch (error) {
    console.error("Error raising escalation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
