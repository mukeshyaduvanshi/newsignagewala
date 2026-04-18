/**
 * Vendor Tenders — Controller Layer
 * Cache-aside (Redis) + pub/sub publish after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { publish } from "@/lib/utils/pubsub";
import {
  VendorCacheKeys,
  VendorCacheTTL,
  VendorSSEChannels,
} from "@/lib/utils/vendor-cache-keys";
import { getTendersByVendor } from "./tenders.service";

export async function getTendersController(vendorId: string) {
  return getOrSetCache(
    VendorCacheKeys.tenders(vendorId),
    () => getTendersByVendor(vendorId),
    VendorCacheTTL.tenders,
    `Tenders[vendor:${vendorId}]`,
  );
}

export async function invalidateTendersCache(vendorId: string) {
  await RedisCache.del(VendorCacheKeys.tenders(vendorId));
}

export async function publishTendersUpdate(vendorId: string) {
  await publish(VendorSSEChannels.tenders(vendorId), { type: "update" });
}
