/**
 * Manager Rates — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import BrandRate from "@/lib/models/BrandRate";

export async function getRatesByParent(parentId: string) {
  await dbConnect();
  return BrandRate.find({
    parentId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();
}
