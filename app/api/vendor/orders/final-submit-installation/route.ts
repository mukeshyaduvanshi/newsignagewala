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
    const { orderId, certificateId } = body;

    if (!orderId || !certificateId) {
      return NextResponse.json(
        { error: "Missing required fields: orderId and certificateId" },
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

    // Check if vendor owns this order
    if (order.vendorId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "You are not authorized to submit this installation" },
        { status: 403 },
      );
    }

    let submittedCount = 0;

    // Find all vendorVerified sites in certificate and mark them as submitted
    certificate.sites.forEach((certSite: any) => {
      if (certSite.status === "vendorVerified" && certSite.siteId) {
        // Mark certificate site as submitted
        certSite.status = "submitted";

        // Find and update corresponding order site
        const orderSite = order.sites.find(
          (site: any) =>
            site.siteId &&
            site.siteId.toString() === certSite.siteId.toString(),
        );

        if (orderSite) {
          orderSite.status = "submitted";
          submittedCount++;
        }
      }
    });

    if (submittedCount === 0) {
      return NextResponse.json(
        { error: "No vendor-verified sites found to submit" },
        { status: 400 },
      );
    }

    // Mark modified for Mongoose to detect changes
    order.markModified("sites");
    certificate.markModified("sites");

    // Check if all sites are now submitted
    const allSitesSubmitted = order.sites.every(
      (site: any) => site.status === "submitted" || site.status === "completed",
    );

    // Update order status when all sites are submitted
    if (allSitesSubmitted) {
      order.orderStatus = "installed";
      certificate.orderStatus = "installed";
    } else {
      if (!["installed", "completed"].includes(order.orderStatus)) {
        order.orderStatus = "installed";
      }
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
      message: "Installation submitted successfully",
      submittedCount,
      allSitesCompleted: false,
      updatedOrder: order,
    });
  } catch (error: any) {
    console.error("Error in final submit installation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit installation" },
      { status: 500 },
    );
  }
}
