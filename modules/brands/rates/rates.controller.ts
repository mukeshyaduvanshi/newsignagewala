/**
 * Brand Rates — Controller Layer
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys, BrandCacheTTL } from "@/lib/utils/brand-cache-keys";
import { getRatesByBrand } from "./rates.service";

export async function getRatesController(brandId: string) {
  return getOrSetCache(
    BrandCacheKeys.rates(brandId),
    () => getRatesByBrand(brandId),
    BrandCacheTTL.rates,
    `Rates[brand:${brandId}]`,
  );
}

export async function invalidateRatesCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.rates(brandId));
}
