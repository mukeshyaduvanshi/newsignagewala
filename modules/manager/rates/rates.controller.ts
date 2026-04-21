/**
 * Manager Rates — Controller Layer
 * Cache-aside (Redis) — cache only when no search query (smart pattern)
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import {
  ManagerCacheKeys,
  ManagerCacheTTL,
} from "@/lib/utils/manager-cache-keys";
import { getRatesByParent } from "./rates.service";

export async function getRatesController(parentId: string, search?: string) {
  // Only cache unfiltered requests (with search → always fresh)
  if (search) {
    const { data } = await (async () => {
      const data = await getRatesByParent(parentId);
      return { data };
    })();
    return { data, source: "mongodb" as const };
  }

  return getOrSetCache(
    ManagerCacheKeys.rates(parentId),
    () => getRatesByParent(parentId),
    ManagerCacheTTL.rates,
    `Rates[manager:${parentId}]`,
  );
}

export async function invalidateRatesCache(parentId: string) {
  await RedisCache.del(ManagerCacheKeys.rates(parentId));
}
