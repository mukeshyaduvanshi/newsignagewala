/**
 * Brand Purchase Authority — Controller Layer
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys, BrandCacheTTL } from "@/lib/utils/brand-cache-keys";
import { getPurchaseAuthoritiesByBrand } from "./purchase-authority.service";

export async function getPurchaseAuthorityController(brandId: string) {
  return getOrSetCache(
    BrandCacheKeys.purchaseAuthority(brandId),
    () => getPurchaseAuthoritiesByBrand(brandId),
    BrandCacheTTL.purchaseAuthority,
    `PurchaseAuthority[brand:${brandId}]`,
  );
}

export async function invalidatePurchaseAuthorityCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.purchaseAuthority(brandId));
}
