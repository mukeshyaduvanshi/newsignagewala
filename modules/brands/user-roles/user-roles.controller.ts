/**
 * Brand User Roles — Controller Layer
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { BrandCacheKeys, BrandCacheTTL } from "@/lib/utils/brand-cache-keys";
import { getUserRolesByBrand } from "./user-roles.service";

export async function getUserRolesController(brandId: string) {
  return getOrSetCache(
    BrandCacheKeys.userRoles(brandId),
    () => getUserRolesByBrand(brandId),
    BrandCacheTTL.userRoles,
    `UserRoles[brand:${brandId}]`,
  );
}

export async function invalidateUserRolesCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.userRoles(brandId));
}
