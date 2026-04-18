/**
 * Brand Cart — Controller Layer
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys, BrandCacheTTL } from "@/lib/utils/brand-cache-keys";
import { getCartByBrand } from "./cart.service";

export async function getCartController(brandId: string) {
  return getOrSetCache(
    BrandCacheKeys.cart(brandId),
    () => getCartByBrand(brandId),
    BrandCacheTTL.cart,
    `Cart[brand:${brandId}]`,
  );
}

export async function invalidateCartCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.cart(brandId));
}
