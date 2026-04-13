import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import Store from "@/lib/models/Store";
import { verifyAccessToken } from "@/lib/auth/jwt";
import pptxgen from "pptxgenjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    // Filter sites with status "submitted"
    const submittedSites = order.sites.filter(
      (site: any) => site.status === "submitted"
    );

    if (submittedSites.length === 0) {
      return NextResponse.json(
        { message: "No submitted sites found in this order" },
        { status: 400 }
      );
    }

    // Fetch store details for each site
    const storeIds = [
      ...new Set(submittedSites.map((site: any) => site.storeId.toString())),
    ];
    const stores = await Store.find({ _id: { $in: storeIds } });

    // Create a map for quick store lookup
    const storeMap = new Map();
    stores.forEach((store) => {
      storeMap.set(store._id.toString(), store);
    });

    // Generate PPT
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE"; // 16:9 aspect ratio
    pptx.author = "Signagewala";
    pptx.title = `Order ${order.orderNumber} - Installation Report`;

    // Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: "F1F5F9" };
    
    titleSlide.addText("Installation Report", {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1,
      fontSize: 44,
      bold: true,
      color: "1E293B",
      align: "center",
    });

    titleSlide.addText([
      { text: "Order Number: ", options: { bold: true } },
      { text: order.orderNumber },
    ], {
      x: 0.5,
      y: 2.8,
      w: 9,
      h: 0.5,
      fontSize: 24,
      color: "475569",
      align: "center",
    });

    titleSlide.addText([
      { text: "PO Number: ", options: { bold: true } },
      { text: order.poNumber || "N/A" },
    ], {
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 0.5,
      fontSize: 20,
      color: "64748B",
      align: "center",
    });

    titleSlide.addText(`Total Submitted Sites: ${submittedSites.length}`, {
      x: 0.5,
      y: 4.2,
      w: 9,
      h: 0.5,
      fontSize: 18,
      color: "64748B",
      align: "center",
    });

    // Generate slides for each submitted site
    for (const site of submittedSites) {
      const store = storeMap.get(site.storeId.toString());

      // Site Info Slide
      const infoSlide = pptx.addSlide();
      infoSlide.background = { color: "FFFFFF" };

      // Header
      infoSlide.addText("Site Information", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: "1E293B",
      });

      // Store Name
      infoSlide.addText([
        { text: "Store: ", options: { bold: true, color: "475569" } },
        { text: site.storeName || "N/A", options: { color: "1E293B" } },
      ], {
        x: 0.5,
        y: 1.0,
        w: 9,
        h: 0.4,
        fontSize: 20,
      });

      // Store Location
      if (store && store.storeAddress) {
        infoSlide.addText([
          { text: "Location: ", options: { bold: true, color: "475569" } },
          { text: store.storeAddress, options: { color: "1E293B" } },
        ], {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 0.4,
          fontSize: 16,
        });
      }

      // Site Description
      infoSlide.addText([
        { text: "Element: ", options: { bold: true, color: "475569" } },
        { text: site.elementName || "N/A", options: { color: "1E293B" } },
      ], {
        x: 0.5,
        y: 2.0,
        w: 9,
        h: 0.4,
        fontSize: 16,
      });

      infoSlide.addText([
        { text: "Description: ", options: { bold: true, color: "475569" } },
        { text: site.siteDescription || "N/A", options: { color: "1E293B" } },
      ], {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 0.4,
        fontSize: 16,
      });

      // Dimensions
      infoSlide.addText([
        { text: "Dimensions: ", options: { bold: true, color: "475569" } },
        {
          text: `${site.width} x ${site.height} ${site.measurementUnit}`,
          options: { color: "1E293B" },
        },
      ], {
        x: 0.5,
        y: 3.0,
        w: 9,
        h: 0.4,
        fontSize: 16,
      });

      // Store Photo (if available)
      if (store && store.storeImage) {
        try {
          infoSlide.addText("Store Photo:", {
            x: 0.5,
            y: 3.6,
            w: 4,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: "475569",
          });
          infoSlide.addImage({
            path: store.storeImage,
            x: 0.5,
            y: 4.0,
            w: 4,
            h: 2.5,
          });
        } catch (error) {
          console.error("Error adding store image:", error);
        }
      }

      // Before & After Comparison Slide
      const comparisonSlide = pptx.addSlide();
      comparisonSlide.background = { color: "FFFFFF" };

      // Header
      comparisonSlide.addText("Before & After", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: "1E293B",
        align: "center",
      });

      // Site name subtitle
      comparisonSlide.addText(site.siteDescription || site.elementName, {
        x: 0.5,
        y: 0.9,
        w: 9,
        h: 0.3,
        fontSize: 16,
        color: "64748B",
        align: "center",
      });

      // Before Photo (site.photo)
      if (site.photo) {
        try {
          comparisonSlide.addText("BEFORE", {
            x: 0.5,
            y: 1.4,
            w: 4.5,
            h: 0.3,
            fontSize: 18,
            bold: true,
            color: "DC2626",
            align: "center",
          });
          comparisonSlide.addImage({
            path: site.photo,
            x: 0.5,
            y: 1.8,
            w: 4.5,
            h: 3.5,
          });
        } catch (error) {
          console.error("Error adding before image:", error);
        }
      }

      // After Photo(s) - First image from capturedImages
      if (site.capturedImages && site.capturedImages.length > 0) {
        try {
          comparisonSlide.addText("AFTER", {
            x: 5,
            y: 1.4,
            w: 4.5,
            h: 0.3,
            fontSize: 18,
            bold: true,
            color: "16A34A",
            align: "center",
          });
          comparisonSlide.addImage({
            path: site.capturedImages[0],
            x: 5,
            y: 1.8,
            w: 4.5,
            h: 3.5,
          });
        } catch (error) {
          console.error("Error adding first after image:", error);
        }

        // If there are more capturedImages, create additional slides
        for (let i = 1; i < site.capturedImages.length; i++) {
          const additionalSlide = pptx.addSlide();
          additionalSlide.background = { color: "FFFFFF" };

          // Header
          additionalSlide.addText(`After Photo ${i + 1}`, {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.5,
            fontSize: 28,
            bold: true,
            color: "1E293B",
            align: "center",
          });

          // Site name subtitle
          additionalSlide.addText(site.siteDescription || site.elementName, {
            x: 0.5,
            y: 0.9,
            w: 9,
            h: 0.3,
            fontSize: 16,
            color: "64748B",
            align: "center",
          });

          // Additional After Photo
          try {
            additionalSlide.addImage({
              path: site.capturedImages[i],
              x: 1.5,
              y: 1.5,
              w: 7,
              h: 4.5,
            });
          } catch (error) {
            console.error(`Error adding after image ${i + 1}:`, error);
          }
        }
      }

      // Installer Details Slide (if available)
      if (site.installers && site.installers.length > 0) {
        const installerSlide = pptx.addSlide();
        installerSlide.background = { color: "F8FAFC" };

        installerSlide.addText("Installer Details", {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.5,
          fontSize: 24,
          bold: true,
          color: "1E293B",
        });

        installerSlide.addText(site.siteDescription || site.elementName, {
          x: 0.5,
          y: 0.9,
          w: 9,
          h: 0.3,
          fontSize: 16,
          color: "64748B",
        });

        let yPos = 1.5;
        site.installers.forEach((installer: any, index: number) => {
          installerSlide.addText([
            { text: `${index + 1}. `, options: { bold: true } },
            { text: "Name: ", options: { bold: true, color: "475569" } },
            { text: installer.name || "N/A", options: { color: "1E293B" } },
          ], {
            x: 0.5,
            y: yPos,
            w: 9,
            h: 0.3,
            fontSize: 16,
          });

          installerSlide.addText([
            { text: "Phone: ", options: { bold: true, color: "475569" } },
            { text: installer.phone || "N/A", options: { color: "1E293B" } },
          ], {
            x: 0.5,
            y: yPos + 0.4,
            w: 9,
            h: 0.3,
            fontSize: 14,
          });

          if (installer.capturedAt) {
            const date = new Date(installer.capturedAt);
            installerSlide.addText([
              { text: "Captured: ", options: { bold: true, color: "475569" } },
              { text: date.toLocaleString(), options: { color: "64748B" } },
            ], {
              x: 0.5,
              y: yPos + 0.8,
              w: 9,
              h: 0.3,
              fontSize: 14,
            });
          }

          yPos += 1.5;
        });
      }
    }

    // Summary Slide
    const summarySlide = pptx.addSlide();
    summarySlide.background = { color: "F1F5F9" };

    summarySlide.addText("Installation Complete", {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1,
      fontSize: 36,
      bold: true,
      color: "16A34A",
      align: "center",
    });

    summarySlide.addText(`${submittedSites.length} Sites Successfully Installed`, {
      x: 0.5,
      y: 3.2,
      w: 9,
      h: 0.5,
      fontSize: 24,
      color: "475569",
      align: "center",
    });

    summarySlide.addText("Thank you!", {
      x: 0.5,
      y: 4.2,
      w: 9,
      h: 0.5,
      fontSize: 20,
      color: "64748B",
      align: "center",
    });

    // Generate PPT as base64
    const pptxData = await pptx.write({ outputType: "base64" });

    // Return as response
    return NextResponse.json({
      success: true,
      pptData: pptxData,
      fileName: `Order_${order.orderNumber}_Installation_Report.pptx`,
    });
  } catch (error: any) {
    console.error("Error generating PPT:", error);
    return NextResponse.json(
      { message: "Error generating PPT", error: error.message },
      { status: 500 }
    );
  }
}
