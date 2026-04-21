/**
 * Manager Racee — Controller Layer
 * Cache-aside (Redis) — cache only when no filters (smart pattern)
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import {
  ManagerCacheKeys,
  ManagerCacheTTL,
} from "@/lib/utils/manager-cache-keys";
import { getRaceeByManager } from "./racee.service";

export async function getRaceeController(
  managerId: string,
  parentId: string,
  filters: { status?: string; search?: string } = {},
) {
  // Only cache unfiltered requests (with filters → always fresh)
  if (filters.status || filters.search) {
    const data = await getRaceeByManager(managerId, parentId, filters);
    return { data, source: "mongodb" as const };
  }

  return getOrSetCache(
    ManagerCacheKeys.racee(managerId),
    () => getRaceeByManager(managerId, parentId),
    ManagerCacheTTL.racee,
    `Racee[manager:${managerId}]`,
  );
}

export async function invalidateRaceeCache(managerId: string) {
  await RedisCache.del(ManagerCacheKeys.racee(managerId));
}
