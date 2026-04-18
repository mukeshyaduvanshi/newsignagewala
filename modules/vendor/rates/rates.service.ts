/**
 * Vendor Rates — Service Layer
 * Raw DB queries — koi auth nahi, koi HTTP nahi
 */

import dbConnect from "@/lib/db/mongodb";
import VendorRate from "@/lib/models/VendorRate";

export async function getRatesByVendor(vendorId: string) {
  await dbConnect();
  return VendorRate.find({
    $or: [{ createdId: vendorId }, { parentId: vendorId }],
    isActive: true,
  })
    .select("-__v")
    .sort({ createdAt: -1 })
    .lean();
}
