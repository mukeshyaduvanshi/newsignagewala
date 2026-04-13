/**
 * Production-Safe Sidebar Cache Utilities
 * 
 * - Cache key versioning (v1) for future schema changes
 * - User ID validation to prevent "undefined" keys
 * - Reduced TTL (10 minutes instead of 1 hour)
 * - Graceful fallback on all Redis errors
 * - Reusable cache helper pattern
 */

import { RedisCache } from '@/lib/db/redis';

// Cache configuration
const CACHE_VERSION = 'v1'; // Increment when schema changes
const CACHE_TTL = 600; // 10 minutes (reduced from 1 hour for fresher data)

// Cache key prefixes with versioning
const CACHE_PREFIX = {
  TEAM_AUTHORITY: `sidebar:${CACHE_VERSION}:team:`,
  STORE_AUTHORITY: `sidebar:${CACHE_VERSION}:store:`,
} as const;

/**
 * Validate user ID before creating cache key
 * Prevents undefined/null keys from being created
 */
function validateUserId(userId: string | undefined | null, context: string): string {
  if (!userId || userId === 'undefined' || userId === 'null') {
    throw new Error(`${context}: Invalid userId provided (${userId})`);
  }
  return userId;
}

/**
 * Cache key generators with versioning
 */
export const CacheKeys = {
  userRoles: (userId: string, userType: 'brand' | 'vendor') => {
    const validUserId = validateUserId(userId, 'CacheKeys.userRoles');
    return `${CACHE_PREFIX.TEAM_AUTHORITY}${userType}:${validUserId}`;
  },
  
  storeAuthority: (userId: string) => {
    const validUserId = validateUserId(userId, 'CacheKeys.storeAuthority');
    return `${CACHE_PREFIX.STORE_AUTHORITY}brand:${validUserId}`;
  },
  
  // Pattern for invalidating all user's sidebar cache
  userSidebarPattern: (userId: string) => {
    const validUserId = validateUserId(userId, 'CacheKeys.userSidebarPattern');
    return `sidebar:${CACHE_VERSION}:*:*:${validUserId}`;
  },
};

/**
 * Reusable Cache Helper Pattern
 * 
 * getOrSetCache() - Generic cache-aside pattern
 * 
 * 1. Check Redis cache
 * 2. If HIT → return cached data
 * 3. If MISS → execute fetchFunction()
 * 4. Store result in Redis with TTL
 * 5. Return result
 * 
 * Handles errors gracefully - never crashes API
 */
export async function getOrSetCache<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  ttl: number = CACHE_TTL,
  logContext: string = 'Cache'
): Promise<{ data: T; source: 'redis' | 'mongodb' }> {
  try {
    // Step 1: Try Redis cache
    const cached = await RedisCache.get<T>(cacheKey);
    
    if (cached) {
      console.log(`✅ [REDIS CACHE HIT] ${logContext}`);
      console.log(`📦 [FROM REDIS] ${logContext}`);
      return { data: cached, source: 'redis' };
    }
    
    console.log(`❌ [REDIS CACHE MISS] ${logContext}`);
  } catch (error) {
    console.warn(`⚠️ Redis GET failed for ${logContext}:`, error instanceof Error ? error.message : error);
  }

  // Step 2: Cache MISS - Fetch from database
  console.log(`🔍 [FROM MONGODB] ${logContext}`);
  const data = await fetchFunction();

  // Step 3: Store in cache (non-blocking, failures are logged but don't affect response)
  try {
    const success = await RedisCache.set(cacheKey, data, ttl);
    if (success) {
      console.log(`✅ [REDIS CACHE SET] ${logContext} (TTL: ${ttl}s)`);
    } else {
      console.warn(`⚠️ [REDIS CACHE SET FAILED] ${logContext}`);
    }
  } catch (error) {
    console.warn(`⚠️ Redis SET failed for ${logContext}:`, error instanceof Error ? error.message : error);
  }

  // Step 4: Return data (always succeeds, even if Redis fails)
  return { data, source: 'mongodb' };
}

/**
 * Get User Roles from cache or database
 * Uses getOrSetCache helper for clean implementation
 */
export async function getCachedUserRoles(
  userId: string, 
  userType: 'brand' | 'vendor',
  fetchFunction: () => Promise<any[]>
): Promise<{ data: any[]; source: 'redis' | 'mongodb' }> {
  try {
    const cacheKey = CacheKeys.userRoles(userId, userType);
    const logContext = `User Roles for ${userType} user: ${userId}`;
    
    return await getOrSetCache(cacheKey, fetchFunction, CACHE_TTL, logContext);
  } catch (error) {
    console.error('Error in getCachedUserRoles:', error instanceof Error ? error.message : error);
    // Fallback: Execute fetch function directly
    const data = await fetchFunction();
    return { data, source: 'mongodb' };
  }
}

/**
 * Get Store Authority from cache or database
 * Uses getOrSetCache helper for clean implementation
 */
export async function getCachedStoreAuthority(
  userId: string,
  fetchFunction: () => Promise<any[]>
): Promise<{ data: any[]; source: 'redis' | 'mongodb' }> {
  try {
    const cacheKey = CacheKeys.storeAuthority(userId);
    const logContext = `Store Authority for user: ${userId}`;
    
    return await getOrSetCache(cacheKey, fetchFunction, CACHE_TTL, logContext);
  } catch (error) {
    console.error('Error in getCachedStoreAuthority:', error instanceof Error ? error.message : error);
    // Fallback: Execute fetch function directly
    const data = await fetchFunction();
    return { data, source: 'mongodb' };
  }
}

/**
 * Invalidate User Roles cache
 * Call this when user roles are created, updated, or deleted
 */
export async function invalidateUserRolesCache(
  userId: string,
  userType: 'brand' | 'vendor'
): Promise<void> {
  try {
    const validUserId = validateUserId(userId, 'invalidateUserRolesCache');
    const cacheKey = CacheKeys.userRoles(validUserId, userType);
    
    const deleted = await RedisCache.del(cacheKey);
    
    if (deleted > 0) {
      console.log(`🗑️ [REDIS CACHE INVALIDATED] User Roles for ${userType} user: ${validUserId}`);
    }
  } catch (error) {
    console.error('Error invalidating user roles cache:', error instanceof Error ? error.message : error);
    // Non-critical error - log and continue
  }
}

/**
 * Invalidate Store Authority cache
 * Call this when store authority is created, updated, or deleted
 */
export async function invalidateStoreAuthorityCache(userId: string): Promise<void> {
  try {
    const validUserId = validateUserId(userId, 'invalidateStoreAuthorityCache');
    const cacheKey = CacheKeys.storeAuthority(validUserId);
    
    const deleted = await RedisCache.del(cacheKey);
    
    if (deleted > 0) {
      console.log(`🗑️ [REDIS CACHE INVALIDATED] Store Authority for user: ${validUserId}`);
    }
  } catch (error) {
    console.error('Error invalidating store authority cache:', error instanceof Error ? error.message : error);
    // Non-critical error - log and continue
  }
}

/**
 * Invalidate ALL sidebar cache for a user
 * Call this on logout or when user data changes significantly
 * Uses SCAN for production safety (not KEYS)
 */
export async function invalidateAllUserSidebarCache(userId: string): Promise<void> {
  try {
    const validUserId = validateUserId(userId, 'invalidateAllUserSidebarCache');
    const pattern = CacheKeys.userSidebarPattern(validUserId);
    
    const deleted = await RedisCache.delPattern(pattern);
    
    if (deleted > 0) {
      console.log(`🗑️ [REDIS CACHE INVALIDATED] All sidebar cache for user: ${validUserId} (${deleted} keys deleted)`);
    }
  } catch (error) {
    console.error('Error invalidating all user sidebar cache:', error instanceof Error ? error.message : error);
    // Non-critical error - log and continue
  }
}

/**
 * Debug: Check cache status for a user
 */
export async function checkCacheStatus(userId: string, userType: 'brand' | 'vendor'): Promise<{
  userRoles: { exists: boolean; ttl: number };
  storeAuthority: { exists: boolean; ttl: number };
}> {
  try {
    const validUserId = validateUserId(userId, 'checkCacheStatus');
    const userRolesKey = CacheKeys.userRoles(validUserId, userType);
    const storeKey = CacheKeys.storeAuthority(validUserId);
    
    const [userRolesExists, storeExists, userRolesTTL, storeTTL] = await Promise.all([
      RedisCache.exists(userRolesKey),
      RedisCache.exists(storeKey),
      RedisCache.ttl(userRolesKey),
      RedisCache.ttl(storeKey),
    ]);
    
    return {
      userRoles: { exists: userRolesExists, ttl: userRolesTTL },
      storeAuthority: { exists: storeExists, ttl: storeTTL },
    };
  } catch (error) {
    console.error('Error checking cache status:', error instanceof Error ? error.message : error);
    return {
      userRoles: { exists: false, ttl: -2 },
      storeAuthority: { exists: false, ttl: -2 },
    };
  }
}
