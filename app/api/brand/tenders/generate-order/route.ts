import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Tender from "@/lib/models/Tender";
import Order from "@/lib/models/Order";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenderId } = await req.json();

    if (!tenderId) {
      return NextResponse.json(
        { error: "Tender ID is required" },
        { status: 400 }
      );
    }

    // Find the tender and verify it belongs to this brand
    const tender = await Tender.findOne({
      _id: tenderId,
      brandId: decoded.userId,
    });

    if (!tender) {
      return NextResponse.json(
        { error: "Tender not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if tender has an accepted vendor
    if (!tender.acceptedVendorId) {
      return NextResponse.json(
        { error: "No vendor has been accepted for this tender yet" },
        { status: 400 }
      );
    }

    // Generate order number in ORD-MMYY-SL format
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    
    // Find existing orders for this month and year
    const existingOrders = await Order.find({
      orderNumber: new RegExp(`^ORD-${month}${year}-`),
    }).sort({ orderNumber: -1 });

    let serialNumber = 1;
    if (existingOrders.length > 0) {
      const lastOrderNumber = existingOrders[0].orderNumber;
      const lastSerial = parseInt(lastOrderNumber.split("-")[2]);
      serialNumber = lastSerial + 1;
    }

    const orderNumber = `ORD-${month}${year}-${serialNumber}`;

    // Create order from tender data
    const orderData = {
      brandId: tender.brandId,
      vendorId: tender.acceptedVendorId,
      storeId: tender.storeId,
      storeLocation: tender.storeLocation,
      orderNumber,
      poNumber: tender.tenderNumber, // tenderNumber becomes poNumber
      orderDate: new Date(),
      deadlineDate: tender.deadlineDate,
      orderType: "order",
      globalCreativeLink: tender.globalCreativeLink || "",
      notes: tender.notes || "",
      additionalCharges: tender.additionalCharges || [],
      sites: tender.sites.map((site: any) => ({
        siteId: site.siteId,
        elementName: site.elementName,
        siteDescription: site.siteDescription,
        storeName: site.storeName,
        storeId: site.storeId,
        photo: site.photo,
        width: site.width,
        height: site.height,
        measurementUnit: site.measurementUnit,
        rate: site.rate, // This will be vendor's rate after acceptance
        calculateUnit: site.calculateUnit,
        quantity: site.quantity,
        creativeLink: site.creativeLink || "",
        storeAddress: site.storeAddress,
        storeLocation: site.storeLocation,
        storeCity: site.storeCity,
        storeState: site.storeState,
        storePincode: site.storePincode,
      })),
      subtotal: tender.subtotal,
      additionalChargesTotal: tender.additionalChargesTotal || 0,
      tax: tender.tax,
      total: tender.total,
      orderStatus: "new",
    };

    // Create the order
    const order = await Order.create(orderData);

    return NextResponse.json(
      {
        message: "Order generated successfully from tender",
        order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error generating order from tender:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate order" },
      { status: 500 }
    );
  }
}
