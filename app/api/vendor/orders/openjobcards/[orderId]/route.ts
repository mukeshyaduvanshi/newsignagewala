import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import mongoose, { ObjectId } from "mongoose";

// Site schema for OpenJobCards
const siteSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId },
  elementName: { type: String },
  siteDescription: { type: String },
  storeName: { type: String },
  storeId: { type: mongoose.Schema.Types.ObjectId },
  photo: { type: String },
  width: { type: Number },
  height: { type: Number },
  measurementUnit: { type: String },
  rate: { type: Number },
  calculateUnit: { type: String },
  quantity: { type: Number },
  creativeLink: { type: String },
  instructions: { type: String },
  storeLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
}, { _id: false });

// OpenJobCards schema
const openJobCardsSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  orderNumber: { type: String, required: true },
  jobCardNumber: { type: Number, required: true },
  orderDate: { type: Date, required: true },
  deadlineDate: { type: Date, required: true },
  globalCreativeLink: { type: String },
  notes: { type: String },
  orderStatus: { type: String, required: true },
  sites: [siteSchema],
  createdAt: { type: Date, default: Date.now },
});

const OpenJobCards =
  mongoose.models.OpenJobCards ||
  mongoose.model("OpenJobCards", openJobCardsSchema);

// Order schema
const orderSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // ... other fields
});

const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    // Get token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    await dbConnect();

    const { orderId } = await params;
    console.log("Get Job Cards - Order ID:", orderId);

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 },
      );
    }

    // Verify order belongs to this vendor
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      vendorId: new mongoose.Types.ObjectId(decoded.userId),
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found or you don't have permission",
        },
        { status: 404 },
      );
    }

    // Fetch all job cards for this order
    const jobCards = await OpenJobCards.find({
      orderId: new mongoose.Types.ObjectId(orderId),
    }).sort({ createdAt: -1 });

    console.log("Get Job Cards - Found:", jobCards.length);

    return NextResponse.json(
      {
        success: true,
        jobCards: jobCards,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching job cards:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "Server error", error: errorMessage },
      { status: 500 },
    );
  }
}
