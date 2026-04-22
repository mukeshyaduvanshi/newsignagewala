import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import { uploadToVercelBlob } from "@/lib/utils/uploadToBlob";
import mongoose from "mongoose";
import { invalidateOrdersCache } from "@/modules/manager/orders/orders.controller";
import {
  invalidateBrandOrdersCache,
  invalidateVendorOrdersCache,
} from "@/modules/manager/cache-invalidation";

export async function POST(req: NextRequest) {
  try {
    // Authenticate manager
    const managerAuth = await requireManagerAuth(req);

    // Parse form data
    const formData = await req.formData();
    const orderId = formData.get("orderId") as string;
    const siteId = formData.get("siteId") as string;
    const file = formData.get("file") as File;

    if (!orderId || !siteId || !file) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, siteId, file" },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();

    // Build query for finding order
    const query: any = {
      _id: new mongoose.Types.ObjectId(orderId),
    };

    // Add creativeManagerId filter if available
    if (managerAuth.teamMemberId) {
      query.creativeManagerId = new mongoose.Types.ObjectId(
        managerAuth.teamMemberId,
      );
    }

    // Find the order
    const order = await Order.findOne(query);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not assigned to you" },
        { status: 404 },
      );
    }

    // Find the specific site
    const siteIndex = order.sites.findIndex(
      (site: any) => site._id.toString() === siteId,
    );

    if (siteIndex === -1) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Upload new creative to Vercel Blob
    const timestamp = Date.now();
    const uploadResult = await uploadToVercelBlob({
      file,
      folder: "creatives",
      filename: `creative-${timestamp}`,
      maxSizeKB: 2000, // 2MB max for creatives
      quality: 85,
    });

    // Store old photo URL and update with new URL
    const oldPhoto = order.sites[siteIndex].photo;
    order.sites[siteIndex].oldPhoto = oldPhoto;
    order.sites[siteIndex].creativeAdaptive = uploadResult.url;

    // Save the order
    await order.save();

    await invalidateOrdersCache(managerAuth.userId).catch(() => {});
    await invalidateBrandOrdersCache(order.brandId?.toString()).catch(() => {});
    await invalidateVendorOrdersCache(order.vendorId?.toString()).catch(
      () => {},
    );

    return NextResponse.json({
      success: true,
      message: "Creative uploaded successfully",
      newPhotoUrl: uploadResult.url,
      oldPhotoUrl: oldPhoto,
      uploadStats: {
        originalSize: uploadResult.originalSize,
        compressedSize: uploadResult.compressedSize,
        compressionRatio: uploadResult.compressionRatio,
      },
    });
  } catch (error) {
    console.error("Error uploading creative:", error);
    return NextResponse.json(
      {
        error: "Failed to upload creative",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
