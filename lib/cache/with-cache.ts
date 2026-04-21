/**
 * Per-User Redis Cache Utility for API Routes
 *
 * Usage:
 *   const data = await apiCache(
 *     `admin:stats:v1`,          // cache key (non-user-specific global stats)
 *     60,                         // TTL in seconds
 *     () => fetchFromDB()         // fallback DB fetch
 *   );
 *
 * For user-scoped data:
 *   const data = await apiCache(
 *     `brand:stores:v1:${userId}`,
 *     120,
 *     () => getStoresFromDB(userId)
 *   );
 */

import { RedisCache } from "@/lib/db/redis";

/**
 * Generic cache-aside helper for API routes.
 * - Checks Redis first (fast, ~5ms)
 * - Falls back to fetchFn() on miss (DB)
 * - Stores result in Redis with given TTL
 * - Never throws — gracefully falls back to DB on Redis failure
 */
export async function apiCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  // 1. Try Redis
  try {
    const cached = await RedisCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  // 2. Fetch from DB
  const data = await fetchFn();

  // 3. Store in Redis (non-blocking, failure is silent)
  RedisCache.set(key, data, ttlSeconds).catch(() => {});

  return data;
}

/**
 * Invalidate a specific cache key or pattern.
 * Call this after mutation routes (POST/PUT/DELETE) to clear stale data.
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  try {
    await RedisCache.del(keyOrPattern);
  } catch {
    // Safe to ignore — stale data will expire via TTL anyway
  }
}
