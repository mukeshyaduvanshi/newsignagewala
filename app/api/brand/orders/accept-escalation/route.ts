import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import PurchaseAuthority from "@/lib/models/PurchaseAuthority";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { priceCalculatorNumber } from "@/lib/utils/priceCalculator";
import {
  invalidateBrandOrdersCache,
  invalidateVendorOrdersCache,
  invalidateManagerOrdersCacheByCreativeId,
} from "@/modules/manager/cache-invalidation";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get token from Authorization header
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
    const { orderId, finalSites, finalAdditionalCharges, finalTotal } = body;

    console.log(
      "🔵 BRAND API: Received finalSites:",
      finalSites?.map((s: any) => ({ name: s.elementName, rate: s.rate })),
    );
    console.log("🔵 BRAND API: Received finalTotal:", finalTotal);

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Find the order
    await dbConnect();
    const order = await Order.findById(orderId).populate(
      "vendorId",
      "companyName email phone",
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify brand owns this order
    if (order.brandId?.toString() !== brandId) {
      return NextResponse.json(
        { error: "Unauthorized - This order does not belong to you" },
        { status: 403 },
      );
    }

    // Check if order status is "escalation"
    if (order.orderStatus !== "escalation") {
      return NextResponse.json(
        { error: "Can only accept escalated orders" },
        { status: 400 },
      );
    }

    // Check if there are any escalations
    if (!order.priceEscalation || order.priceEscalation.length === 0) {
      return NextResponse.json(
        { error: "No price escalations found" },
        { status: 400 },
      );
    }

    // Get the latest escalation (last one in array)
    const latestEscalation =
      order.priceEscalation[order.priceEscalation.length - 1];

    // Store original total for PO Number calculation
    const originalTotal = order.total;

    // If finalSites provided, use those rates directly (most accurate)
    if (finalSites && Array.isArray(finalSites)) {
      console.log("🔵 BRAND API: Applying finalSites rates to order.sites");
      finalSites.forEach((finalSite: any, index: number) => {
        if (order.sites[index]) {
          console.log(
            `  Site ${index}: ${order.sites[index].elementName} - Old rate: ${order.sites[index].rate}, New rate: ${finalSite.rate}`,
          );
          order.sites[index].rate = finalSite.rate;
        }
      });
      console.log(
        "🔵 BRAND API: After applying rates:",
        order.sites.map((s: any) => ({ name: s.elementName, rate: s.rate })),
      );
    } else {
      // Fallback: Apply newRates from latest escalation to sites
      latestEscalation.siteChanges.forEach((change: any) => {
        if (order.sites[change.siteIndex]) {
          order.sites[change.siteIndex].rate = change.newRate;
        }
      });
    }

    // Apply additional charges
    if (finalAdditionalCharges !== undefined) {
      order.additionalChargesTotal = finalAdditionalCharges;
    } else if (
      latestEscalation.additionalChargeChanges &&
      latestEscalation.additionalChargeChanges.length > 0
    ) {
      const latestAdditionalCharge =
        latestEscalation.additionalChargeChanges[
          latestEscalation.additionalChargeChanges.length - 1
        ];
      order.additionalChargesTotal = latestAdditionalCharge.newAmount;
    }

    // Recalculate totals using priceCalculatorNumber (handles all measurement units correctly)
    const subtotal = order.sites.reduce((sum: number, site: any) => {
      return sum + priceCalculatorNumber(site);
    }, 0);

    const totalBeforeTax = subtotal + order.additionalChargesTotal;
    const tax = totalBeforeTax * 0.18; // 18% GST
    const newTotal = totalBeforeTax + tax;

    order.subtotal = subtotal;
    order.tax = tax;
    order.total = newTotal;

    console.log("🔵 BRAND API: Final calculated total:", newTotal);
    console.log(
      "🔵 BRAND API: Final order.sites rates:",
      order.sites.map((s: any) => ({ name: s.elementName, rate: s.rate })),
    );

    // Update order status to "accepted"
    order.orderStatus = "accepted";

    // Clear the priceEscalation array after acceptance
    order.priceEscalation = [];

    // Handle PO Number logic if poNumber exists
    if (order.poNumber) {
      const po = await PurchaseAuthority.findOne({ poNumber: order.poNumber });

      if (po) {
        const difference = newTotal - originalTotal;

        if (difference > 0) {
          // New total is more than original - add to pending amount
          const remainingAmount = po.amount - po.usedAmount;

          if (remainingAmount >= difference) {
            // Sufficient balance - add to usedAmount
            po.usedAmount += difference;
          } else {
            return NextResponse.json(
              {
                error: `Insufficient PO balance. Remaining: ₹${remainingAmount.toFixed(2)}, Required: ₹${difference.toFixed(2)}`,
              },
              { status: 400 },
            );
          }
        } else if (difference < 0) {
          // New total is less than original - reduce from usedAmount
          po.usedAmount += difference; // difference is negative, so this reduces usedAmount

          // Ensure usedAmount doesn't go below 0
          if (po.usedAmount < 0) {
            po.usedAmount = 0;
          }
        }

        await po.save();
      }
      // If PO not found, just continue without error (PO might be deleted)
    }

    // Save the order
    // Normalize legacy 'complete' status value
    if ((order.orderStatus as string) === "complete") {
      order.orderStatus = "completed";
    }
    await order.save();

    await invalidateBrandOrdersCache(brandId).catch(() => {});
    await invalidateVendorOrdersCache(
      order.vendorId?._id?.toString() || order.vendorId?.toString(),
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Escalation accepted successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        originalTotal,
        difference: newTotal - originalTotal,
      },
    });
  } catch (error) {
    console.error("Error accepting escalation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
