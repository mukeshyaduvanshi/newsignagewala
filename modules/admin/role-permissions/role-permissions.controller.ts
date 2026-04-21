/**
 * Admin Role Permissions — Controller Layer
 * Cache-aside (Redis) + cache invalidation after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { AdminCacheKeys, AdminCacheTTL } from "@/lib/utils/admin-cache-keys";
import { getRolePermissionsByAdmin } from "./role-permissions.service";

export async function getRolePermissionsController(adminId: string) {
  return getOrSetCache(
    AdminCacheKeys.rolePermissions(adminId),
    () => getRolePermissionsByAdmin(adminId),
    AdminCacheTTL.rolePermissions,
    `RolePermissions[admin:${adminId}]`,
  );
}

export async function invalidateRolePermissionsCache(adminId: string) {
  await RedisCache.del(AdminCacheKeys.rolePermissions(adminId));
}
