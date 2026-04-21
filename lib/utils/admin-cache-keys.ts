/**
 * Admin Cache Keys & TTL Configuration
 *
 * All Redis cache key generators for the admin module.
 * TTLs are tuned by data freshness requirements:
 *  - rates         → 5 min
 *  - role-perms    → 15 min
 *  - user-roles    → 15 min
 */

const V = "v1"; // bump when schema changes

function validate(id: string, ctx: string): string {
  if (!id || id === "undefined" || id === "null") {
    throw new Error(`AdminCacheKeys.${ctx}: Invalid id "${id}"`);
  }
  return id;
}

export const AdminCacheKeys = {
  // --- List caches (per admin user) ----------------------------------------
  rates: (adminId: string) => `admin:${V}:rates:${validate(adminId, "rates")}`,

  rolePermissions: (adminId: string) =>
    `admin:${V}:role-perms:${validate(adminId, "rolePermissions")}`,

  userRoles: (adminId: string) =>
    `admin:${V}:user-roles:${validate(adminId, "userRoles")}`,

  // --- Wildcard patterns (for invalidation) ---------------------------------
  allForAdmin: (adminId: string) =>
    `admin:${V}:*:${validate(adminId, "allForAdmin")}`,
};

/** TTLs in seconds */
export const AdminCacheTTL = {
  rates: 300, // 5 min
  rolePermissions: 900, // 15 min
  userRoles: 900, // 15 min
} as const;
