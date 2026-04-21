/**
 * Manager Cache Keys & TTL Configuration
 *
 * All Redis cache key generators for the manager module.
 * TTLs are tuned by data freshness requirements:
 *  - orders        → 1 min   (near-real-time)
 *  - stores        → 5 min
 *  - racee         → 2 min
 *  - rates         → 10 min
 *  - role-perms    → 15 min
 *  - authorities   → 15 min
 *  - members       → 5 min
 */

const V = "v1"; // bump when schema changes

function validate(id: string, ctx: string): string {
  if (!id || id === "undefined" || id === "null") {
    throw new Error(`ManagerCacheKeys.${ctx}: Invalid id "${id}"`);
  }
  return id;
}

export const ManagerCacheKeys = {
  // --- List caches (per manager user) ----------------------------------------
  orders: (managerId: string) =>
    `manager:${V}:orders:${validate(managerId, "orders")}`,

  stores: (managerId: string) =>
    `manager:${V}:stores:${validate(managerId, "stores")}`,

  racee: (managerId: string) =>
    `manager:${V}:racee:${validate(managerId, "racee")}`,

  rates: (parentId: string) =>
    `manager:${V}:rates:${validate(parentId, "rates")}`,

  rolePermissions: (managerId: string) =>
    `manager:${V}:role-perms:${validate(managerId, "rolePermissions")}`,

  // --- Team caches (per brand/parent) ----------------------------------------
  authorities: (parentId: string) =>
    `manager:${V}:authorities:${validate(parentId, "authorities")}`,

  members: (parentId: string) =>
    `manager:${V}:members:${validate(parentId, "members")}`,

  // --- Wildcard patterns (for invalidation) ---------------------------------
  allForManager: (managerId: string) =>
    `manager:${V}:*:${validate(managerId, "allForManager")}`,
};

/** TTLs in seconds */
export const ManagerCacheTTL = {
  orders: 60, // 1 min  — near-real-time
  stores: 300, // 5 min
  racee: 120, // 2 min
  rates: 600, // 10 min
  rolePermissions: 900, // 15 min
  authorities: 900, // 15 min
  members: 300, // 5 min
} as const;
