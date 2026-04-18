/**
 * Brand Rates — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import BrandRate from "@/lib/models/BrandRate";

export async function getRatesByBrand(brandId: string) {
  await dbConnect();
  return BrandRate.find({
    $or: [{ createdId: brandId }, { parentId: brandId }],
    isActive: true,
  })
    .select("-__v")
    .sort({ createdAt: -1 })
    .lean();
}
