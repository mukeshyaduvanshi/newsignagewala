import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Tender from "@/lib/models/Tender";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys } from "@/lib/utils/brand-cache-keys";
import { VendorCacheKeys } from "@/lib/utils/vendor-cache-keys";

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

    const { tenderId, vendorId } = await req.json();

    if (!tenderId || !vendorId) {
      return NextResponse.json(
        { error: "Tender ID and Vendor ID are required" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // Verify that this vendor has submitted a bid
    const vendorBid = tender.biddings.find(
      (bid: any) =>
        bid.vendorId.toString() === vendorId && bid.status === "submitted",
    );

    if (!vendorBid) {
      return NextResponse.json(
        { error: "No valid bid found from this vendor" },
        { status: 400 },
      );
    }

    // Get the bid amount (use tender total if not specified)
    const bidAmount = vendorBid.amount || tender.total;

    // Update tender sites with vendor's custom rates
    if (vendorBid.customRates && vendorBid.customRates.length > 0) {
      // Mark sites array as modified for Mongoose
      tender.markModified("sites");

      vendorBid.customRates.forEach((customRate: any) => {
        const siteIndex = tender.sites.findIndex(
          (site: any) => site.siteId.toString() === customRate.siteId,
        );
        if (siteIndex !== -1) {
          tender.sites[siteIndex].rate = customRate.vendorRate;
        }
      });
    }

    // Update additional charges with vendor's charges
    if (vendorBid.vendorCharges && vendorBid.vendorCharges.length > 0) {
      tender.additionalCharges = vendorBid.vendorCharges.map((vc: any) => ({
        label: vc.label,
        amount: vc.amount,
      }));

      // Calculate new additional charges total
      tender.additionalChargesTotal = vendorBid.vendorCharges.reduce(
        (sum: number, vc: any) => sum + parseFloat(vc.amount),
        0,
      );
    }

    // Calculate new subtotal, tax from vendor rates
    let newSubtotal = 0;
    tender.sites.forEach((site: any) => {
      if (site.calculateUnit === "sqft" && site.measurementUnit === "feet") {
        newSubtotal += site.rate * site.width * site.height * site.quantity;
      } else if (
        site.calculateUnit === "sqft" &&
        site.measurementUnit === "inch"
      ) {
        newSubtotal +=
          site.rate * (site.width / 12) * (site.height / 12) * site.quantity;
      } else if (
        site.calculateUnit === "sqin" &&
        site.measurementUnit === "feet"
      ) {
        newSubtotal +=
          site.rate * (site.width * 12) * (site.height * 12) * site.quantity;
      } else if (
        site.calculateUnit === "sqin" &&
        site.measurementUnit === "inch"
      ) {
        newSubtotal += site.rate * site.width * site.height * site.quantity;
      } else {
        newSubtotal += site.rate * site.quantity;
      }
    });

    const newTax = (newSubtotal + (tender.additionalChargesTotal || 0)) * 0.18;
    const newTotal =
      newSubtotal + (tender.additionalChargesTotal || 0) + newTax;

    // Save original rates before updating
    tender.originalSubtotal = tender.subtotal;
    tender.originalTax = tender.tax;
    tender.originalTotal = tender.total;

    // Update the tender with accepted vendor and new pricing
    tender.acceptedVendorId = vendorId;
    tender.subtotal = Math.round(newSubtotal * 100) / 100;
    tender.tax = Math.round(newTax * 100) / 100;
    tender.total = Math.round(newTotal * 100) / 100;
    await tender.save();

    await RedisCache.del(BrandCacheKeys.tenders(decoded.userId)).catch(
      () => {},
    );
    await RedisCache.del(VendorCacheKeys.tenders(vendorId)).catch(() => {});

    return NextResponse.json(
      {
        message: "Vendor bid accepted successfully",
        tender,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error accepting vendor bid:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept vendor bid" },
      { status: 500 },
    );
  }
}
