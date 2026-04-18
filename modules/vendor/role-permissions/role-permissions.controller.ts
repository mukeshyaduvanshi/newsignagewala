/**
 * Vendor Role Permissions — Controller Layer
 * Cache-aside (Redis) + cache invalidation after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { VendorCacheKeys, VendorCacheTTL } from "@/lib/utils/vendor-cache-keys";
import { getRolePermissionsByVendor } from "./role-permissions.service";

export async function getRolePermissionsController(vendorId: string) {
  return getOrSetCache(
    VendorCacheKeys.rolePermissions(vendorId),
    () => getRolePermissionsByVendor(vendorId),
    VendorCacheTTL.rolePermissions,
    `RolePermissions[vendor:${vendorId}]`,
  );
}

export async function invalidateRolePermissionsCache(vendorId: string) {
  await RedisCache.del(VendorCacheKeys.rolePermissions(vendorId));
}
