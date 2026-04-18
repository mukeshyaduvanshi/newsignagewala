import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import Cart from "@/lib/models/cart.model";
import PurchaseAuthority from "@/lib/models/PurchaseAuthority";
import mongoose from "mongoose";
import {
  getOrdersController,
  createOrderController,
} from "@/modules/brands/orders/orders.controller";

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
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      poNumber,
      orderDate,
      deadlineDate,
      orderType,
      globalCreativeLink,
      notes,
      additionalCharges,
      sites,
      vendorId,
      creativeManagerId,
      subtotal,
      additionalChargesTotal,
      tax,
      total,
    } = body;

    if (
      !orderDate ||
      !deadlineDate ||
      !orderType ||
      !sites ||
      sites.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor selection is required" },
        { status: 400 },
      );
    }

    const order = await createOrderController(decoded.userId, {
      vendorId,
      creativeManagerId,
      poNumber,
      orderDate: new Date(orderDate),
      deadlineDate: new Date(deadlineDate),
      orderType,
      globalCreativeLink,
      notes,
      additionalCharges,
      sites,
      subtotal: subtotal || 0,
      additionalChargesTotal: additionalChargesTotal || 0,
      tax: tax || 0,
      total: total || 0,
    });

    return NextResponse.json(
      { message: "Order placed successfully", orderId: order._id.toString() },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
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
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    const { data: orders, source } = await getOrdersController(decoded.userId);
    return NextResponse.json({ orders, source }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
