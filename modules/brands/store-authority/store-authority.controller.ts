/**
 * Brand Store Authority — Controller Layer
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys, BrandCacheTTL } from "@/lib/utils/brand-cache-keys";
import { getStoreAuthoritiesByBrand } from "./store-authority.service";

export async function getStoreAuthorityController(brandId: string) {
  return getOrSetCache(
    BrandCacheKeys.storeAuthority(brandId),
    () => getStoreAuthoritiesByBrand(brandId),
    BrandCacheTTL.storeAuthority,
    `StoreAuthority[brand:${brandId}]`,
  );
}

export async function invalidateStoreAuthorityCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.storeAuthority(brandId));
}
