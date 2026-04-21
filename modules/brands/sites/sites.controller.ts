/**
 * Brand Sites — Controller Layer
 * Cache-aside (Redis) — cached per storeId (5 min TTL)
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys, BrandCacheTTL } from "@/lib/utils/brand-cache-keys";
import { getSitesByStore } from "./sites.service";

export async function getSitesController(storeId: string) {
  return getOrSetCache(
    BrandCacheKeys.sites(storeId),
    () => getSitesByStore(storeId),
    BrandCacheTTL.sites,
    `Sites[store:${storeId}]`,
  );
}

export async function invalidateSitesCache(storeId: string) {
  await RedisCache.del(BrandCacheKeys.sites(storeId));
}
