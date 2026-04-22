import { RedisCache } from "@/lib/db/redis";
import TeamMember from "@/lib/models/TeamMember";
import { ManagerCacheKeys } from "@/lib/utils/manager-cache-keys";
import { BrandCacheKeys } from "@/lib/utils/brand-cache-keys";
import { VendorCacheKeys } from "@/lib/utils/vendor-cache-keys";

/**
 * Clear brand order cache — called when vendor mutates an order
 * so brand sees updated order status immediately.
 */
export async function invalidateBrandOrdersCache(
  brandId: string,
): Promise<void> {
  if (!brandId) return;
  await RedisCache.del(BrandCacheKeys.orders(brandId)).catch(() => {});
}

/**
 * Clear vendor order cache — called when brand mutates an order
 * so vendor sees updated order status immediately.
 */
export async function invalidateVendorOrdersCache(
  vendorId: string,
): Promise<void> {
  if (!vendorId) return;
  await RedisCache.del(VendorCacheKeys.orders(vendorId)).catch(() => {});
}

/**
 * Clear vendor tender cache — called when brand accepts a bid
 * so vendor sees tender status change immediately.
 */
export async function invalidateVendorTendersCache(
  vendorId: string,
): Promise<void> {
  if (!vendorId) return;
  await RedisCache.del(VendorCacheKeys.tenders(vendorId)).catch(() => {});
}

/**
 * Clear admin stats + paginated user list caches — called when admin
 * approves/rejects/updates a user so dashboard counts are accurate.
 */
export async function invalidateAdminUserCaches(): Promise<void> {
  await Promise.all([
    RedisCache.del("admin:stats:v1").catch(() => {}),
    RedisCache.del("admin:users:v1:*").catch(() => {}),
  ]);
}

/**
 * Clear manager's own order cache — called when manager mutates an order
 * so the manager's own order list refreshes.
 */
export async function invalidateManagerOrdersCache(
  managerId: string,
): Promise<void> {
  if (!managerId) return;
  await RedisCache.del(ManagerCacheKeys.orders(managerId)).catch(() => {});
}

/**
 * Clear the manager order cache when brand/vendor changes an order that has
 * a creativeManagerId set. Looks up the manager userId from TeamMember.
 */
export async function invalidateManagerOrdersCacheByCreativeId(
  creativeManagerId: string | null | undefined,
): Promise<void> {
  if (!creativeManagerId) return;
  try {
    const teamMember = (await TeamMember.findById(creativeManagerId)
      .select("userId")
      .lean()) as any;
    if (!teamMember?.userId) return;
    await RedisCache.del(
      ManagerCacheKeys.orders(teamMember.userId.toString()),
    ).catch(() => {});
  } catch {
    // non-critical
  }
}

export async function invalidateManagerSidebarCacheByParent(parentId: string) {
  if (!parentId) return;

  await RedisCache.del(ManagerCacheKeys.authorities(parentId)).catch(() => {});

  const managers = await TeamMember.find({
    parentId,
    status: "active",
  })
    .select("userId")
    .lean();

  const managerIds = Array.from(
    new Set(
      managers
        .map((m: any) => m?.userId?.toString())
        .filter((id): id is string => Boolean(id)),
    ),
  );

  await Promise.all(
    managerIds.map((managerId) =>
      RedisCache.del(ManagerCacheKeys.rolePermissions(managerId)).catch(
        () => 0,
      ),
    ),
  );
}
