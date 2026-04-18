/**
 * Vendor User Roles — Controller Layer
 * Cache-aside (Redis) + cache invalidation after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { VendorCacheKeys, VendorCacheTTL } from "@/lib/utils/vendor-cache-keys";
import { getUserRolesByVendor } from "./user-roles.service";

export async function getUserRolesController(vendorId: string) {
  return getOrSetCache(
    VendorCacheKeys.userRoles(vendorId),
    () => getUserRolesByVendor(vendorId),
    VendorCacheTTL.userRoles,
    `UserRoles[vendor:${vendorId}]`,
  );
}

export async function invalidateUserRolesCache(vendorId: string) {
  await RedisCache.del(VendorCacheKeys.userRoles(vendorId));
}
