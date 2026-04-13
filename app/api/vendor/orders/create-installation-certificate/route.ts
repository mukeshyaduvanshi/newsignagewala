import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import InstallationCertificate from "@/lib/models/InstallationCertificate";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    console.log(
      "Create Installation Certificate - Access Token:",
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
      "Create Installation Certificate - Decoded token:",
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
    console.log("Create Installation Certificate - Order ID:", orderId);
    console.log(
      "Create Installation Certificate - Selected Sites Count:",
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

    // Find the order with populated store details
    const order = await Order.findOne({
      _id: new ObjectId(orderId),
      vendorId: new ObjectId(decoded.userId),
    });
    
    console.log("Create Installation Certificate - Order found:", order ? "Yes" : "No");

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found or you don't have permission",
        },
        { status: 404 },
      );
    }

    // Create new InstallationCertificate entry with store details included in sites
    console.log("Create Installation Certificate - Creating new entry");
    const installCertificate = await InstallationCertificate.create({
      orderId: new ObjectId(orderId),
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      deadlineDate: order.deadlineDate,
      orderStatus: order.orderStatus,
      sites: selectedSites, // Only selected sites
    });

    console.log("Create Installation Certificate", installCertificate);

    console.log("Create Installation Certificate - Created successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Installation certificate created successfully",
        installCertificateId: installCertificate._id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create Installation Certificate - Error:", error);
    console.error("Create Installation Certificate - Error stack:", error.stack);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create installation certificate" },
      { status: 500 },
    );
  }
}
