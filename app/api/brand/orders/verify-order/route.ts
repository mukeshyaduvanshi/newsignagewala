import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import Order from "@/lib/models/Order";
import {
  invalidateBrandOrdersCache,
  invalidateVendorOrdersCache,
  invalidateManagerOrdersCacheByCreativeId,
} from "@/modules/manager/cache-invalidation";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify the order belongs to this brand
    if (order.brandId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Unauthorized access to order" },
        { status: 403 },
      );
    }

    // Update order status to completed
    order.orderStatus = "completed";

    // Mark all sites as verified
    order.sites.forEach((site: any) => {
      site.referenceStatus = "verified";
    });

    // Normalize legacy 'complete' status value
    if ((order.orderStatus as string) === "complete") {
      order.orderStatus = "completed";
    }

    await order.save();

    await invalidateBrandOrdersCache(decoded.userId).catch(() => {});
    await invalidateVendorOrdersCache(order.vendorId?.toString()).catch(
      () => {},
    );

    return NextResponse.json({
      success: true,
      message: "Order verified and marked as completed",
      order: order,
    });
  } catch (error: any) {
    console.error("Error verifying order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify order" },
      { status: 500 },
    );
  }
}
