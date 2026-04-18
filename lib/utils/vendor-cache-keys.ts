/**
 * Vendor Cache Keys & TTL Configuration
 *
 * All Redis cache key generators for the vendor module are here.
 * TTLs are tuned by data freshness requirements:
 *  - orders        → 1 min   (needs near-real-time)
 *  - tenders       → 2 min
 *  - rates         → 10 min
 *  - role-perms    → 15 min
 *  - user-roles    → 15 min
 */

const V = "v1"; // bump when schema changes

function validate(id: string, ctx: string): string {
  if (!id || id === "undefined" || id === "null") {
    throw new Error(`VendorCacheKeys.${ctx}: Invalid id "${id}"`);
  }
  return id;
}

export const VendorCacheKeys = {
  // --- List caches (per vendor user) ----------------------------------------
  orders: (vendorId: string) =>
    `vendor:${V}:orders:${validate(vendorId, "orders")}`,

  tenders: (vendorId: string) =>
    `vendor:${V}:tenders:${validate(vendorId, "tenders")}`,

  rates: (vendorId: string) =>
    `vendor:${V}:rates:${validate(vendorId, "rates")}`,

  rolePermissions: (vendorId: string) =>
    `vendor:${V}:role-perms:${validate(vendorId, "rolePermissions")}`,

  userRoles: (vendorId: string) =>
    `vendor:${V}:user-roles:${validate(vendorId, "userRoles")}`,

  // --- Wildcard patterns (for invalidation) ---------------------------------
  allForVendor: (vendorId: string) =>
    `vendor:${V}:*:${validate(vendorId, "allForVendor")}`,
};

/** TTLs in seconds */
export const VendorCacheTTL = {
  orders: 60, // 1 min
  tenders: 120, // 2 min
  rates: 600, // 10 min
  rolePermissions: 900, // 15 min
  userRoles: 900, // 15 min
} as const;

/** Redis Pub/Sub channel names for SSE notifications */
export const VendorSSEChannels = {
  orders: (vendorId: string) =>
    `vendor:sse:orders:${validate(vendorId, "sse:orders")}`,

  tenders: (vendorId: string) =>
    `vendor:sse:tenders:${validate(vendorId, "sse:tenders")}`,
};
