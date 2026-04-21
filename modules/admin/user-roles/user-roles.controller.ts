/**
 * Admin User Roles — Controller Layer
 * Cache-aside (Redis) + cache invalidation after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { AdminCacheKeys, AdminCacheTTL } from "@/lib/utils/admin-cache-keys";
import { getUserRolesByAdmin } from "./user-roles.service";

export async function getUserRolesController(adminId: string) {
  return getOrSetCache(
    AdminCacheKeys.userRoles(adminId),
    () => getUserRolesByAdmin(adminId),
    AdminCacheTTL.userRoles,
    `UserRoles[admin:${adminId}]`,
  );
}

export async function invalidateUserRolesCache(adminId: string) {
  await RedisCache.del(AdminCacheKeys.userRoles(adminId));
}
