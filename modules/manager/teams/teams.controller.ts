/**
 * Manager Teams — Controller Layer
 * Cache-aside (Redis) + cache invalidation after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import {
  ManagerCacheKeys,
  ManagerCacheTTL,
} from "@/lib/utils/manager-cache-keys";
import { getAuthoritiesByParent, getMembersByParent } from "./teams.service";

export async function getAuthoritiesController(parentId: string) {
  return getOrSetCache(
    ManagerCacheKeys.authorities(parentId),
    () => getAuthoritiesByParent(parentId),
    ManagerCacheTTL.authorities,
    `Authorities[parent:${parentId}]`,
  );
}

export async function getMembersController(
  parentId: string,
  filters: {
    uniqueKey?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  // Only cache the default listing (page 1, no search, status=active, no uniqueKey)
  const isDefaultQuery =
    !filters.uniqueKey &&
    !filters.search &&
    (filters.status === undefined || filters.status === "active") &&
    (filters.page === undefined || filters.page === 1) &&
    (filters.limit === undefined || filters.limit === 20);

  if (!isDefaultQuery) {
    const result = await getMembersByParent(parentId, filters);
    return { data: result, source: "mongodb" as const };
  }

  return getOrSetCache(
    ManagerCacheKeys.members(parentId),
    () => getMembersByParent(parentId, filters),
    ManagerCacheTTL.members,
    `Members[parent:${parentId}]`,
  );
}

export async function invalidateAuthoritiesCache(parentId: string) {
  await RedisCache.del(ManagerCacheKeys.authorities(parentId));
}

export async function invalidateMembersCache(parentId: string) {
  await RedisCache.del(ManagerCacheKeys.members(parentId));
}
