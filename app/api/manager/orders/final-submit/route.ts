import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import mongoose from "mongoose";
import { invalidateOrdersCache } from "@/modules/manager/orders/orders.controller";
import {
  invalidateBrandOrdersCache,
  invalidateVendorOrdersCache,
} from "@/modules/manager/cache-invalidation";

export async function PATCH(req: NextRequest) {
  try {
    // Authenticate manager
    const managerAuth = await requireManagerAuth(req);

    // Parse request body
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing required field: orderId" },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();

    // Build query for finding order
    const query: any = {
      _id: new mongoose.Types.ObjectId(orderId),
    };

    // Add creativeManagerId filter if available
    if (managerAuth.teamMemberId) {
      query.creativeManagerId = new mongoose.Types.ObjectId(
        managerAuth.teamMemberId,
      );
    }

    // Find the order
    const order = await Order.findOne(query);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not assigned to you" },
        { status: 404 },
      );
    }

    // Update order status to "creativeAdapted"
    order.orderStatus = "creativeAdapted";
    await order.save();

    await invalidateOrdersCache(managerAuth.userId).catch(() => {});
    await invalidateBrandOrdersCache(order.brandId?.toString()).catch(() => {});
    await invalidateVendorOrdersCache(order.vendorId?.toString()).catch(
      () => {},
    );

    return NextResponse.json({
      success: true,
      message: "Order submitted successfully",
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error("Error submitting order:", error);
    return NextResponse.json(
      { error: "Failed to submit order" },
      { status: 500 },
    );
  }
}
