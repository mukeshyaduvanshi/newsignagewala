import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { ObjectId } from "mongodb";

// OpenJobCards model (inline for now)
import mongoose from "mongoose";

const siteSchema = new mongoose.Schema(
  {
    siteId: { type: mongoose.Schema.Types.ObjectId },
    elementName: { type: String },
    siteDescription: { type: String },
    storeName: { type: String },
    storeId: { type: mongoose.Schema.Types.ObjectId },
    photo: { type: String },
    creativeAdaptive: { type: String },
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
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  { _id: false },
);

const openJobCardsSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    console.log(
      "Create Job Card - Access Token:",
      token ? "Present" : "Missing",
    );

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authorization token required" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(token);
    console.log(
      "Create Job Card - Decoded token:",
      decoded ? "Valid" : "Invalid",
    );

    if (!decoded || decoded.userType !== "vendor") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 },
      );
    }

    await dbConnect();

    const { orderId, selectedSites } = await request.json();
    console.log("Create Job Card - Order ID:", orderId);
    console.log(
      "Create Job Card - Selected Sites Count:",
      selectedSites?.length,
    );

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 },
      );
    }

    if (!selectedSites || selectedSites.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one site must be selected" },
        { status: 400 },
      );
    }

    // Find the order
    const order = await Order.findOne({
      _id: new ObjectId(orderId),
      vendorId: new ObjectId(decoded.userId),
    });
    console.log("Create Job Card - Order found:", order ? "Yes" : "No");

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found or you don't have permission",
        },
        { status: 404 },
      );
    }

    // Don't check for existing openjobcardsId - allow multiple job cards for same order

    // Count existing job cards for this order to generate next jobCardNumber
    const existingJobCards = await OpenJobCards.countDocuments({
      orderId: new ObjectId(orderId),
    });
    const jobCardNumber = existingJobCards + 1;

    // Create new OpenJobCards entry with selected sites only
    console.log("Create Job Card - Creating new entry");
    console.log("Create Job Card - Job Card Number:", jobCardNumber);
    const openJobCard = await OpenJobCards.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      jobCardNumber: jobCardNumber,
      orderDate: order.orderDate,
      deadlineDate: order.deadlineDate,
      globalCreativeLink: order.globalCreativeLink || "",
      notes: order.notes || "",
      orderStatus: order.orderStatus,
      sites: selectedSites,
    });

    console.log("Create Job Card", openJobCard);

    // Don't update order with openjobcardsId - we can have multiple job cards
    // order.openjobcardsId = openJobCard._id;
    // await order.save();

    console.log("Create Job Card - Created successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Job card created successfully",
        openjobcardsId: openJobCard._id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create Job Card - Error:", error);
    console.error("Create Job Card - Error stack:", error.stack);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create job card" },
      { status: 500 },
    );
  }
}
