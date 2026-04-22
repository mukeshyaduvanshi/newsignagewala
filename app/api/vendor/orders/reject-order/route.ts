import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import mongoose from "mongoose";
import {
  invalidateOrdersCache,
  publishOrdersUpdate,
} from "@/modules/vendor/orders/orders.controller";
import { invalidateBrandOrdersCache } from "@/modules/manager/cache-invalidation";

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

    await dbConnect();

    const body = await request.json();
    const { orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Find the order
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      vendorId: new mongoose.Types.ObjectId(decoded.userId),
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or you don't have permission to reject it" },
        { status: 404 },
      );
    }

    // Check if order can be rejected
    const rejectableStatuses = ["new", "creativeAdapted", "creativeaddepted"];
    if (!rejectableStatuses.includes(order.orderStatus)) {
      return NextResponse.json(
        { error: `Cannot reject order with status: ${order.orderStatus}` },
        { status: 400 },
      );
    }

    // Update order status to cancelled (rejected)
    order.orderStatus = "rejected";
    // Note: If you need rejectionReason, add it to Order model schema first
    await order.save();

    await invalidateOrdersCache(decoded.userId);
    await invalidateBrandOrdersCache(order.brandId?.toString());
    await publishOrdersUpdate(decoded.userId);

    return NextResponse.json(
      {
        message: "Order rejected successfully",
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error rejecting order:", error);
    return NextResponse.json(
      { error: "Failed to reject order" },
      { status: 500 },
    );
  }
}
