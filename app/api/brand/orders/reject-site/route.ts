import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import Order from "@/lib/models/Order";
import InstallationCertificate from "@/lib/models/InstallationCertificate";

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
    const { orderId, siteId, remarks } = body;

    if (!orderId || !siteId || !remarks) {
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

    // Find the site by siteId
    const site = order.sites.find(
      (s: any) => s.siteId && s.siteId.toString() === siteId.toString(),
    );

    if (!site) {
      return NextResponse.json(
        { error: "Site not found in order" },
        { status: 404 },
      );
    }

    // Add rejection remarks and update status
    site.rejectionRemarks = remarks;
    site.rejectionStatus = "rejected";
    site.rejectedAt = new Date();

    // Mark modified for Mongoose to detect nested changes
    order.markModified("sites");

    // Normalize legacy 'complete' status value
    if ((order.orderStatus as string) === "complete") {
      order.orderStatus = "completed";
    }

    await order.save();

    // Find and update installation certificates with this site
    const installCerts = await InstallationCertificate.find({
      orderId: orderId,
    });

    for (const cert of installCerts) {
      const certSite = cert.sites.find(
        (s: any) => s.siteId && s.siteId.toString() === siteId.toString(),
      );

      if (certSite && certSite.status === "submitted") {
        certSite.status = "pending";
        cert.markModified("sites");
        await cert.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Site rejected successfully",
      order,
    });
  } catch (error: any) {
    console.error("Error rejecting site:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject site" },
      { status: 500 },
    );
  }
}
