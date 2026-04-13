import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Tender from "@/lib/models/Tender";
import Cart from "@/lib/models/cart.model";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/auth/jwt";

// POST: Create a new tender
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

    const brandId = decoded.userId;
    const body = await req.json();

    // Generate tender number in TND-MMYY-SL format
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const monthYear = `${month}${year}`;
    
    const tenderCount = await Tender.countDocuments();
    const serialNumber = tenderCount + 1;
    const tenderNumber = `TND-${monthYear}-${serialNumber}`;

    // Create tender
    const tender = await Tender.create({
      ...body,
      brandId,
      tenderNumber,
      storeLocation: body.storeLocation,
      status: "pending", // Always pending when first created
    });

    // Remove items from cart if tender was successfully created
    if (body.sites && body.sites.length > 0) {
      const siteIds = body.sites.map((site: any) => site.siteId);

      // Find the brand's cart
      const cart = await Cart.findOne({ brandId });

      if (cart) {
        // Filter out items that were ordered
        cart.items = cart.items.filter(
          (item: any) => !siteIds.some((id: string) => id === item.siteId?.toString() || id === item._id?.toString())
        );
        await cart.save();
      }
    }

    return NextResponse.json(
      {
        message: "Tender created successfully",
        tender,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating tender:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create tender" },
      { status: 500 }
    );
  }
}

// GET: Fetch all tenders for the brand
export async function GET(req: NextRequest) {
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

    const brandId = decoded.userId;

    // Fetch all tenders for this brand
    const tenders = await Tender.find({ brandId })
      .sort({ createdAt: -1 })
      .lean();

    // Populate vendor information for biddings
    const tendersWithVendorInfo = await Promise.all(
      tenders.map(async (tender) => {
        if (tender.biddings && tender.biddings.length > 0) {
          const biddingsWithVendorInfo = await Promise.all(
            tender.biddings.map(async (bid: any) => {
              const vendor = await User.findById(bid.vendorId)
                .select("name email phone")
                .lean();
              
              return {
                ...bid,
                vendorInfo: vendor || null,
              };
            })
          );

          return {
            ...tender,
            biddings: biddingsWithVendorInfo,
          };
        }
        return tender;
      })
    );

    return NextResponse.json({ tenders: tendersWithVendorInfo }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching tenders:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tenders" },
      { status: 500 }
    );
  }
}
