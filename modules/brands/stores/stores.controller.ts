/**
 * Brand Stores — Controller Layer
 * Cache-aside (Redis) — cache only unfiltered list (smart pattern)
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys, BrandCacheTTL } from "@/lib/utils/brand-cache-keys";
import { getStoresByBrand } from "./stores.service";

export async function getStoresController(
  brandId: string,
  filters: { search?: string; storeId?: string; limit?: number } = {},
) {
  // Only cache unfiltered listing (search/storeId/limit → always fresh from DB)
  const isFilteredQuery = filters.search || filters.storeId || filters.limit;

  if (isFilteredQuery) {
    const data = await getStoresByBrand(brandId, filters);
    return { data, source: "mongodb" as const };
  }

  return getOrSetCache(
    BrandCacheKeys.stores(brandId),
    () => getStoresByBrand(brandId),
    BrandCacheTTL.stores,
    `Stores[brand:${brandId}]`,
  );
}

export async function invalidateStoresCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.stores(brandId));
}
