import { RedisCache } from "@/lib/db/redis";
import TeamMember from "@/lib/models/TeamMember";
import { ManagerCacheKeys } from "@/lib/utils/manager-cache-keys";

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
