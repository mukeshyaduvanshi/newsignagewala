import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import Cart from "@/lib/models/cart.model";
import PurchaseAuthority from "@/lib/models/PurchaseAuthority";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const {
      orderNumber,
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
      storeId,
      storeLocation,
      subtotal,
      additionalChargesTotal,
      tax,
      total,
    } = body;

    // Validate required fields
    if (!orderDate || !deadlineDate || !orderType || !sites || sites.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor selection is required" },
        { status: 400 }
      );
    }

    // Generate order number in format ORD-MMYY-SL
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
    const year = String(now.getFullYear()).slice(-2); // Last 2 digits
    const monthYear = `${month}${year}`; // e.g., 0126
    
    // Count existing orders to get serial number
    const orderCount = await Order.countDocuments();
    const serialNumber = orderCount + 1;
    const generatedOrderNumber = `ORD-${monthYear}-${serialNumber}`;

    // Create new order
    const newOrder = new Order({
      brandId: new mongoose.Types.ObjectId(decoded.userId),
      vendorId: new mongoose.Types.ObjectId(vendorId),
      creativeManagerId: creativeManagerId ? new mongoose.Types.ObjectId(creativeManagerId) : undefined,
      // storeId: storeId ? new mongoose.Types.ObjectId(storeId) : undefined,
      // storeLocation,
      orderNumber: generatedOrderNumber,
      poNumber,
      orderDate: new Date(orderDate),
      deadlineDate: new Date(deadlineDate),
      orderType,
      globalCreativeLink,
      notes,
      additionalCharges: additionalCharges || [],
      sites: sites.map((site: any) => ({
        siteId: new mongoose.Types.ObjectId(site.siteId),
        elementName: site.elementName,
        siteDescription: site.siteDescription,
        storeName: site.storeName,
        storeId: new mongoose.Types.ObjectId(site.storeId),
        storeLocation: site.storeLocation,
        photo: site.photo,
        width: site.width,
        height: site.height,
        measurementUnit: site.measurementUnit,
        rate: site.rate,
        calculateUnit: site.calculateUnit,
        quantity: site.quantity,
        creativeLink: site.creativeLink,
        instructions: site.instructions,
      })),
      subtotal: subtotal || 0,
      additionalChargesTotal: additionalChargesTotal || 0,
      tax: tax || 0,
      total: total || 0,
      orderStatus: creativeManagerId ? "creativeaddepted" : "new",
    });

    
    await newOrder.save();

    // Update purchase authority used amount if PO number is provided
    if (poNumber) {
      try {
        const purchaseAuthority = await PurchaseAuthority.findOne({
          poNumber,
          brandId: decoded.userId,
          isActive: true,
        });

        if (purchaseAuthority) {
          purchaseAuthority.usedAmount = (purchaseAuthority.usedAmount || 0) + total;
          await purchaseAuthority.save();
        }
      } catch (paError) {
        console.error("Error updating purchase authority:", paError);
        // Don't fail the order if PA update fails
      }
    }

    // Remove ordered sites from cart
    const cart = await Cart.findOne({ brandId: decoded.userId });
    if (cart) {
      const orderedSiteIds = sites.map((site: any) => site.siteId);
      // Filter out items that match ordered site IDs
      cart.items = cart.items.filter(
        (item: any) => !orderedSiteIds.some((orderedId: string) => 
          item.siteId.toString() === orderedId || item._id.toString() === orderedId
        )
      );
      await cart.save();
    }

    return NextResponse.json(
      {
        message: "Order placed successfully",
        orderId: newOrder._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
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
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await dbConnect();

    const orders = await Order.find({ brandId: decoded.userId })
      .sort({ createdAt: -1 })
      .populate("vendorId", "companyName email phone")
      .lean();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
