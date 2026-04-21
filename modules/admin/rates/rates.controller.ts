/**
 * Admin Rates — Controller Layer
 * Cache-aside (Redis) + cache invalidation after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { AdminCacheKeys, AdminCacheTTL } from "@/lib/utils/admin-cache-keys";
import { getRatesByAdmin } from "./rates.service";

export async function getRatesController(adminId: string) {
  return getOrSetCache(
    AdminCacheKeys.rates(adminId),
    () => getRatesByAdmin(adminId),
    AdminCacheTTL.rates,
    `Rates[admin:${adminId}]`,
  );
}

export async function invalidateRatesCache(adminId: string) {
  await RedisCache.del(AdminCacheKeys.rates(adminId));
}
