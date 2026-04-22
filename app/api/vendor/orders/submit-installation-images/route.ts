import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import Order from "@/lib/models/Order";
import InstallationCertificate from "@/lib/models/InstallationCertificate";
import {
  invalidateOrdersCache,
  publishOrdersUpdate,
} from "@/modules/vendor/orders/orders.controller";
import {
  invalidateBrandOrdersCache,
  invalidateManagerOrdersCacheByCreativeId,
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

    if (!decoded || decoded.userType !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, certificateId, siteId, selectedImages } = body;

    if (!orderId || !certificateId || !siteId || !selectedImages) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Find the installation certificate
    const certificate = await InstallationCertificate.findById(certificateId);
    if (!certificate) {
      return NextResponse.json(
        { error: "Installation certificate not found" },
        { status: 404 },
      );
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Find the certificate site by siteId
    const certSite = certificate.sites.find(
      (site: any) =>
        site.siteId && site.siteId.toString() === siteId.toString(),
    );

    if (!certSite) {
      return NextResponse.json(
        { error: "Site not found in certificate" },
        { status: 404 },
      );
    }

    // Find matching site in order by siteId
    const orderSite = order.sites.find(
      (site: any) =>
        site.siteId && site.siteId.toString() === siteId.toString(),
    );

    if (!orderSite) {
      return NextResponse.json(
        { error: "Site not found in order" },
        { status: 404 },
      );
    }

    if (Array.isArray(selectedImages) && selectedImages.length > 0) {
      // Initialize capturedImages array if it doesn't exist
      if (!orderSite.capturedImages) {
        orderSite.capturedImages = [];
      }

      // Add new images (avoiding duplicates)
      const existingImages = orderSite.capturedImages;
      const newImages = selectedImages.filter(
        (img: string) => !existingImages.includes(img),
      );

      orderSite.capturedImages = [...existingImages, ...newImages];

      // Copy installer info if exists
      if (certSite.installers && certSite.installers.length > 0) {
        if (!orderSite.installers) {
          orderSite.installers = [];
        }
        // Add installer info (avoiding duplicates based on phone and timestamp)
        certSite.installers.forEach((installer: any) => {
          const existingInstallers = orderSite.installers || [];
          const exists = existingInstallers.some(
            (existing: any) =>
              existing.phone === installer.phone &&
              existing.capturedAt?.getTime() ===
                installer.capturedAt?.getTime(),
          );
          if (!exists) {
            orderSite.installers!.push(installer);
          }
        });
      }

      // Mark the certificate site as vendor verified
      certSite.status = "vendorVerified";

      // Mark the order site as vendor verified (using siteId match)
      orderSite.status = "vendorVerified";

      // Mark modified for Mongoose to detect changes
      order.markModified("sites");
    }

    // Update order status to installed if not already
    const installableStatuses = [
      "new",
      "accepted",
      "confirmed",
      "in-progress",
      "creativeAdapted",
      "creativeaddepted",
    ];
    if (installableStatuses.includes(order.orderStatus)) {
      order.orderStatus = "installed";
    }

    // Save both documents
    await order.save();
    await certificate.save();

    await invalidateOrdersCache(decoded.userId);
    await invalidateBrandOrdersCache(order.brandId?.toString()).catch(() => {});
    await invalidateManagerOrdersCacheByCreativeId(
      order.creativeManagerId?.toString(),
    ).catch(() => {});
    await publishOrdersUpdate(decoded.userId);

    return NextResponse.json({
      success: true,
      message: "Images submitted successfully",
      updatedOrder: order,
    });
  } catch (error: any) {
    console.error("Error submitting installation images:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit images" },
      { status: 500 },
    );
  }
}
