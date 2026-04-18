/**
 * Brand Role Permissions — Controller Layer
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys, BrandCacheTTL } from "@/lib/utils/brand-cache-keys";
import { getRolePermissionsByBrand } from "./role-permissions.service";

export async function getRolePermissionsController(brandId: string) {
  return getOrSetCache(
    BrandCacheKeys.rolePermissions(brandId),
    () => getRolePermissionsByBrand(brandId),
    BrandCacheTTL.rolePermissions,
    `RolePermissions[brand:${brandId}]`,
  );
}

export async function invalidateRolePermissionsCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.rolePermissions(brandId));
}
