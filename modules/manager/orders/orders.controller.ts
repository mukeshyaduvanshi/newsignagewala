/**
 * Manager Orders — Controller Layer
 * Cache-aside (Redis) + cache invalidation after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import {
  ManagerCacheKeys,
  ManagerCacheTTL,
} from "@/lib/utils/manager-cache-keys";
import { getOrdersByManager } from "./orders.service";

export async function getOrdersController(
  managerId: string,
  teamMemberId?: string,
  parentId?: string,
) {
  return getOrSetCache(
    ManagerCacheKeys.orders(managerId),
    () => getOrdersByManager(managerId, teamMemberId, parentId),
    ManagerCacheTTL.orders,
    `Orders[manager:${managerId}]`,
  );
}

export async function invalidateOrdersCache(managerId: string) {
  await RedisCache.del(ManagerCacheKeys.orders(managerId));
}
