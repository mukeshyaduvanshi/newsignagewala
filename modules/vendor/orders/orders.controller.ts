/**
 * Vendor Orders — Controller Layer
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
import { getOrdersByVendor } from "./orders.service";

export async function getOrdersController(vendorId: string) {
  return getOrSetCache(
    VendorCacheKeys.orders(vendorId),
    () => getOrdersByVendor(vendorId),
    VendorCacheTTL.orders,
    `Orders[vendor:${vendorId}]`,
  );
}

export async function invalidateOrdersCache(vendorId: string) {
  await RedisCache.del(VendorCacheKeys.orders(vendorId));
}

export async function publishOrdersUpdate(vendorId: string) {
  await publish(VendorSSEChannels.orders(vendorId), { type: "update" });
}
