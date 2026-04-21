/**
 * Manager Stores — Controller Layer
 * Cache-aside (Redis) — cache only when no search query (smart pattern)
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import {
  ManagerCacheKeys,
  ManagerCacheTTL,
} from "@/lib/utils/manager-cache-keys";
import { getStoresByManager } from "./stores.service";

export async function getStoresController(
  managerId: string,
  parentId: string,
  search?: string,
) {
  // Only cache unfiltered requests (with search → always fresh)
  if (search) {
    const data = await getStoresByManager(managerId, parentId, search);
    return { data, source: "mongodb" as const };
  }

  return getOrSetCache(
    ManagerCacheKeys.stores(managerId),
    () => getStoresByManager(managerId, parentId),
    ManagerCacheTTL.stores,
    `Stores[manager:${managerId}]`,
  );
}

export async function invalidateStoresCache(managerId: string) {
  await RedisCache.del(ManagerCacheKeys.stores(managerId));
}
