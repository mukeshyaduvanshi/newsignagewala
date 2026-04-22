import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import Order from "@/lib/models/Order";
import Site from "@/lib/models/Site";
import {
  invalidateBrandOrdersCache,
  invalidateVendorOrdersCache,
} from "@/modules/manager/cache-invalidation";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, siteIndex, newReferenceImage } = body;

    if (!orderId || siteIndex === undefined || !newReferenceImage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify the order belongs to this brand
    if (order.brandId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Unauthorized access to order" },
        { status: 403 },
      );
    }

    // Verify site index is valid
    if (siteIndex < 0 || siteIndex >= order.sites.length) {
      return NextResponse.json(
        { error: "Invalid site index" },
        { status: 400 },
      );
    }

    // Verify the new reference image exists in capturedImages array
    const site = order.sites[siteIndex];
    if (
      !site.capturedImages ||
      !site.capturedImages.includes(newReferenceImage)
    ) {
      return NextResponse.json(
        { error: "Selected image not found in captured images" },
        { status: 400 },
      );
    }

    // Update the site's photo (reference image) in the order
    order.sites[siteIndex].photo = newReferenceImage;
    order.sites[siteIndex].referenceStatus = "modified";

    // Also update the photo in the actual Site document
    if (site.siteId) {
      await Site.findByIdAndUpdate(site.siteId, { photo: newReferenceImage });
    }

    // Normalize legacy 'complete' status value
    if ((order.orderStatus as string) === "complete") {
      order.orderStatus = "completed";
    }

    // Save the order
    await order.save();

    await invalidateBrandOrdersCache(decoded.userId).catch(() => {});
    await invalidateVendorOrdersCache(order.vendorId?.toString()).catch(
      () => {},
    );

    return NextResponse.json({
      success: true,
      message: "Reference image updated successfully",
      updatedSite: order.sites[siteIndex],
    });
  } catch (error: any) {
    console.error("Error setting site reference image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update reference image" },
      { status: 500 },
    );
  }
}
