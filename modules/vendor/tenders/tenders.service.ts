/**
 * Vendor Tenders — Service Layer
 * Raw DB queries — koi auth nahi, koi HTTP nahi
 */

import dbConnect from "@/lib/db/mongodb";
import Tender from "@/lib/models/Tender";
import VendorRate from "@/lib/models/VendorRate";

export async function getTendersByVendor(vendorId: string) {
  await dbConnect();

  // Fetch vendor's rates for rate-matching
  const vendorRates = await VendorRate.find({
    $or: [{ createdId: vendorId }, { parentId: vendorId }],
    isActive: true,
  })
    .select("elementName rate calculateUnit")
    .lean();

  const vendorRatesMap = new Map(
    vendorRates.map((rate: any) => [
      rate.elementName,
      { rate: rate.rate, calculateUnit: rate.calculateUnit },
    ]),
  );

  const tenders = await Tender.find({})
    .select(
      "tenderNumber tenderDate deadlineDate sites biddings total storeLocation subtotal tax additionalCharges additionalChargesTotal acceptedVendorId notes poNumber",
    )
    .sort({ createdAt: -1 })
    .lean();

  return tenders.map((tender) => {
    const vendorBid = tender.biddings?.find(
      (bid: any) => bid.vendorId.toString() === vendorId,
    );

    const isAccepted = tender.acceptedVendorId?.toString() === vendorId;

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
      sites: sitesWithVendorRates,
      additionalCharges: tender.additionalCharges,
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
}
