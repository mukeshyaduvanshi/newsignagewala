/**
 * Brand Stores — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import Store from "@/lib/models/Store";

export async function getStoresByBrand(
  brandId: string,
  filters: { search?: string; storeId?: string; limit?: number } = {},
) {
  await dbConnect();

  const query: any = { parentId: brandId, isActive: true };

  if (filters.storeId && filters.storeId.trim()) {
    query._id = filters.storeId.trim();
  }

  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), "i");
    query.$or = [
      { storeName: searchRegex },
      { storePhone: searchRegex },
      { storeAddress: searchRegex },
      { storeCity: searchRegex },
      { storeState: searchRegex },
      { storeCountry: searchRegex },
      { storePincode: searchRegex },
    ];
  }

  let storesQuery = Store.find(query).sort({ createdAt: -1 });

  if (filters.limit && filters.limit > 0) {
    storesQuery = storesQuery.limit(filters.limit);
  }

  return storesQuery.lean();
}
