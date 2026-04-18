/**
 * Vendor Rates — Controller Layer
 * Cache-aside (Redis) + cache invalidation after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { VendorCacheKeys, VendorCacheTTL } from "@/lib/utils/vendor-cache-keys";
import { getRatesByVendor } from "./rates.service";

export async function getRatesController(vendorId: string) {
  return getOrSetCache(
    VendorCacheKeys.rates(vendorId),
    () => getRatesByVendor(vendorId),
    VendorCacheTTL.rates,
    `Rates[vendor:${vendorId}]`,
  );
}

export async function invalidateRatesCache(vendorId: string) {
  await RedisCache.del(VendorCacheKeys.rates(vendorId));
}
