/**
 * Brand Store Authority — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import StoreAuthority from "@/lib/models/StoreAuthority";

export async function getStoreAuthoritiesByBrand(brandId: string) {
  await dbConnect();
  return StoreAuthority.find({
    $or: [{ createdId: brandId }, { parentId: brandId }],
    isActive: true,
  })
    .select(
      "_id storeId storeName storeAddress createdId parentId createdAt updatedAt",
    )
    .sort({ createdAt: -1 })
    .lean();
}
