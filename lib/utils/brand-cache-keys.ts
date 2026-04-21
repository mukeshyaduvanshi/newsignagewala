/**
 * Brand Cache Keys & TTL Configuration
 *
 * All Redis cache key generators for the brand module are here.
 * TTLs are tuned by data freshness requirements:
 *  - cart     → 30 min  (changes often)
 *  - orders   → 1 min   (needs near-real-time)
 *  - tenders  → 2 min
 *  - stores   → 5 min
 *  - racee    → 2 min
 *  - rates    → 10 min
 *  - vendors  → 5 min
 *  - purchase-auth  → 15 min
 *  - store-auth     → 15 min
 *  - role-perms     → 15 min
 *  - user-roles     → 15 min
 *  - checkout-init  → 5 min  (BFF aggregated)
 */

const V = "v1"; // bump when schema changes

function validate(id: string, ctx: string): string {
  if (!id || id === "undefined" || id === "null") {
    throw new Error(`BrandCacheKeys.${ctx}: Invalid id "${id}"`);
  }
  return id;
}

export const BrandCacheKeys = {
  // --- List caches (per brand user) ----------------------------------------
  stores: (brandId: string) =>
    `brand:${V}:stores:${validate(brandId, "stores")}`,

  orders: (brandId: string) =>
    `brand:${V}:orders:${validate(brandId, "orders")}`,

  tenders: (brandId: string) =>
    `brand:${V}:tenders:${validate(brandId, "tenders")}`,

  racee: (brandId: string) => `brand:${V}:racee:${validate(brandId, "racee")}`,

  rates: (brandId: string) => `brand:${V}:rates:${validate(brandId, "rates")}`,

  cart: (userId: string) => `brand:${V}:cart:${validate(userId, "cart")}`,

  vendors: () => `brand:${V}:vendors`,

  purchaseAuthority: (brandId: string) =>
    `brand:${V}:purchase-auth:${validate(brandId, "purchaseAuthority")}`,

  storeAuthority: (brandId: string) =>
    `brand:${V}:store-auth:${validate(brandId, "storeAuthority")}`,

  rolePermissions: (brandId: string) =>
    `brand:${V}:role-perms:${validate(brandId, "rolePermissions")}`,

  userRoles: (brandId: string) =>
    `brand:${V}:user-roles:${validate(brandId, "userRoles")}`,

  // --- BFF aggregated -------------------------------------------------------
  checkoutInit: (brandId: string) =>
    `brand:${V}:checkout-init-v2:${validate(brandId, "checkoutInit")}`,

  // --- Sites (per storeId) --------------------------------------------------
  sites: (storeId: string) => `brand:${V}:sites:${validate(storeId, "sites")}`,

  // --- Wildcard patterns (for invalidation) ---------------------------------
  allForBrand: (brandId: string) =>
    `brand:${V}:*:${validate(brandId, "allForBrand")}`,
};

/** TTLs in seconds */
export const BrandCacheTTL = {
  cart: 1800, // 30 min
  orders: 60, // 1 min
  tenders: 120, // 2 min
  stores: 300, // 5 min
  sites: 300, // 5 min
  racee: 120, // 2 min
  rates: 600, // 10 min
  vendors: 300, // 5 min
  purchaseAuthority: 900, // 15 min
  storeAuthority: 900, // 15 min
  rolePermissions: 900, // 15 min
  userRoles: 900, // 15 min
  checkoutInit: 300, // 5 min
} as const;

/** Redis Pub/Sub channel names for SSE notifications */
export const BrandSSEChannels = {
  orders: (brandId: string) =>
    `brand:sse:orders:${validate(brandId, "sse:orders")}`,

  tenders: (brandId: string) =>
    `brand:sse:tenders:${validate(brandId, "sse:tenders")}`,

  stores: (brandId: string) =>
    `brand:sse:stores:${validate(brandId, "sse:stores")}`,

  racee: (brandId: string) =>
    `brand:sse:racee:${validate(brandId, "sse:racee")}`,
};
