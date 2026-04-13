import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import InstallationCertificate from "@/lib/models/InstallationCertificate";
import { verifyAccessToken } from "@/lib/auth/jwt";
import mongoose from "mongoose";

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

    // Connect to database
    await dbConnect();

    // Get orderId from params
    const { orderId } = await params;

    // Verify order exists and belongs to vendor
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    if (order.vendorId.toString() !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access to this order" },
        { status: 403 },
      );
    }

    // Find all installation certificates for this order
    const installCerts = await InstallationCertificate.find({ 
      orderId: orderId 
    }).sort({ createdAt: -1 }); // Sort by newest first

    return NextResponse.json({
      success: true,
      installCertificates: installCerts,
    });
  } catch (error: any) {
    console.error("Error fetching installation certificates:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch installation certificates",
      },
      { status: 500 },
    );
  }
}
