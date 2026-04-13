import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import Tender from "@/lib/models/Tender";
import VendorRate from "@/lib/models/VendorRate";

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
    if (!decoded || decoded.userType !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Fetch vendor's rates using vendorId
    const vendorRates = await VendorRate.find({ 
      $or: [
        { createdId: decoded.userId },
        { parentId: decoded.userId }
      ],
      isActive: true
    })
      .select("elementName rate calculateUnit")
      .lean();
    
    // Create a map for quick lookup
    const vendorRatesMap = new Map(
      vendorRates.map((rate: any) => [rate.elementName, { rate: rate.rate, calculateUnit: rate.calculateUnit }])
    );

    // Fetch all tenders from all brands
    const tenders = await Tender.find({})
      .select("tenderNumber tenderDate deadlineDate sites biddings total storeLocation subtotal tax additionalCharges additionalChargesTotal acceptedVendorId notes poNumber")
      .sort({ createdAt: -1 })
      .lean();


    // Format the response with only required fields
    const formattedTenders = tenders.map((tender) => {
      const vendorBid = tender.biddings?.find(
        (bid: any) => bid.vendorId.toString() === decoded.userId
      );
      
      // Check if this vendor's bid was accepted
      const isAccepted = tender.acceptedVendorId?.toString() === decoded.userId;
      
      // Add vendor rates to sites
      const sitesWithVendorRates = tender.sites?.map((site: any) => {
        const vendorRateInfo = vendorRatesMap.get(site.elementName);
        return {
          ...site,
          vendorRate: vendorRateInfo?.rate,
        };
      });
      
      return {
        _id: tender._id,
        tenderNumber: tender.tenderNumber,
        poNumber: tender.poNumber,
        tenderDate: tender.tenderDate,
        deadlineDate: tender.deadlineDate,
        totalSites: tender.sites?.length || 0,
        total: tender.total,
        storeLocation: tender.storeLocation,
        // Always include sites with vendor rates
        sites: sitesWithVendorRates,
        // Always include additionalCharges so vendor can see labels
        additionalCharges: tender.additionalCharges,
        // Include pricing details if vendor's bid was accepted
        ...(isAccepted && {
          subtotal: tender.subtotal,
          tax: tender.tax,
          additionalChargesTotal: tender.additionalChargesTotal,
          notes: tender.notes,
        }),
        acceptedVendorId: tender.acceptedVendorId,
        vendorBidding: vendorBid || null,
      };
    });

    console.log({formattedTenders});
    

    return NextResponse.json({ tenders: formattedTenders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tenders for vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenders" },
      { status: 500 }
    );
  }
}
