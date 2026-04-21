/**
 * Manager Role Permissions — Controller Layer
 * Cache-aside (Redis) + cache invalidation after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import {
  ManagerCacheKeys,
  ManagerCacheTTL,
} from "@/lib/utils/manager-cache-keys";
import { getRolePermissionsByManager } from "./role-permissions.service";

export async function getRolePermissionsController(
  managerId: string,
  uniqueKey: string,
  parentId: string,
) {
  return getOrSetCache(
    ManagerCacheKeys.rolePermissions(managerId),
    () => getRolePermissionsByManager(uniqueKey, parentId),
    ManagerCacheTTL.rolePermissions,
    `RolePermissions[manager:${managerId}]`,
  );
}

export async function invalidateRolePermissionsCache(managerId: string) {
  await RedisCache.del(ManagerCacheKeys.rolePermissions(managerId));
}
