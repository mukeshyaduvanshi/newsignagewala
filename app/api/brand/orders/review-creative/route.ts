import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

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
    const { orderId, action } = body;

    if (!orderId || !action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "orderId and action ('accept' or 'reject') are required" },
        { status: 400 },
      );
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.brandId?.toString() !== brandId) {
      return NextResponse.json(
        { error: "Unauthorized - This order does not belong to you" },
        { status: 403 },
      );
    }

    if (action === "accept") {
      order.orderStatus = "new";
    } else {
      order.orderStatus = "creativeaddepted";
    }

    // Normalize legacy 'complete' status value
    if ((order.orderStatus as string) === "complete") {
      order.orderStatus = "completed";
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message:
        action === "accept"
          ? "Creative accepted, order status set to new"
          : "Creative rejected",
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error("Error reviewing creative:", error);
    return NextResponse.json(
      {
        error: "Failed to review creative",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
