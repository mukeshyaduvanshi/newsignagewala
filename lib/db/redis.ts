import Redis from 'ioredis';

/**
 * Production-Safe Redis Client for Vercel Serverless
 * 
 * - Uses ioredis for better serverless compatibility
 * - Global connection caching (similar to MongoDB pattern)
 * - Safe retry strategy (max 3 retries per request)
 * - Graceful fallback if Redis unavailable
 * - No connection pooling issues on serverless
 */

// Global Redis client (cached across serverless invocations)
let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Get or create Redis client (singleton pattern)
 * Cached globally to prevent creating new connections on every request
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      // Serverless-friendly settings
      maxRetriesPerRequest: 3, // Prevent infinite retries in serverless
      enableReadyCheck: false, // Faster connections
      lazyConnect: true, // Don't auto-connect on creation
      
      // Connection timeouts
      connectTimeout: 10000, // 10 seconds
      commandTimeout: 5000,  // 5 seconds per command
      
      // Retry strategy
      retryStrategy(times) {
        if (times > 3) {
          console.error('⚠️ Redis: Max retry attempts reached');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      
      // Reconnect strategy
      reconnectOnError(err) {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        if (targetErrors.some(e => err.message.includes(e))) {
          return true; // Reconnect on these errors
        }
        return false;
      },
    });

    // Event handlers
    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('🚀 Redis ready for commands');
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      // Suppress connection errors (graceful fallback)
      if (!err.message.includes('ECONNREFUSED')) {
        console.error('⚠️ Redis Client Error:', err.message);
      }
      isConnected = false;
    });

    redisClient.on('close', () => {
      console.warn('⚠️ Redis connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
  }

  return redisClient;
}

/**
 * Ensure Redis connection is established
 * Safe for serverless - won't crash if connection fails
 */
async function ensureConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    
    if (isConnected) {
      return true;
    }

    // Try to connect
    await client.connect();
    return true;
  } catch (error) {
    // Graceful fallback - app continues without Redis
    return false;
  }
}

/**
 * Production-Safe Redis Cache Wrapper
 * Handles all Redis operations with graceful fallback
 */
export class RedisCache {
  /**
   * Get value from cache
   * Returns null if Redis unavailable or key doesn't exist
   * NEVER throws - safe for production
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      // Validate key
      if (!key || key.includes('undefined') || key.includes('null')) {
        console.warn(`⚠️ Invalid cache key attempted: "${key}"`);
        return null;
      }

      const connected = await ensureConnection();
      if (!connected) {
        console.warn(`⚠️ Redis unavailable - skipping cache GET for: ${key}`);
        return null;
      }

      const client = getRedisClient();
      const value = await client.get(key);
      
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`❌ Redis GET error for key "${key}":`, error instanceof Error ? error.message : error);
      return null; // Graceful fallback
    }
  }

  /**
   * Set value in cache with TTL
   * Returns true if successful, false otherwise
   * NEVER throws - safe for production
   */
  static async set(key: string, value: any, ttl: number = 600): Promise<boolean> {
    try {
      // Validate key
      if (!key || key.includes('undefined') || key.includes('null')) {
        console.warn(`⚠️ Invalid cache key attempted: "${key}"`);
        return false;
      }

      const connected = await ensureConnection();
      if (!connected) {
        console.warn(`⚠️ Redis unavailable - skipping cache SET for: ${key}`);
        return false;
      }

      const client = getRedisClient();
      await client.setex(key, ttl, JSON.stringify(value));
      
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error for key "${key}":`, error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Delete key(s) from cache using SCAN (production-safe)
   * Supports patterns with wildcards
   * Returns number of keys deleted
   */
  static async del(keyOrPattern: string): Promise<number> {
    try {
      // Validate key
      if (!keyOrPattern || keyOrPattern.includes('undefined') || keyOrPattern.includes('null')) {
        console.warn(`⚠️ Invalid cache key attempted: "${keyOrPattern}"`);
        return 0;
      }

      const connected = await ensureConnection();
      if (!connected) {
        console.warn(`⚠️ Redis unavailable - skipping cache DEL for: ${keyOrPattern}`);
        return 0;
      }

      const client = getRedisClient();

      // If pattern contains wildcard, use SCAN + DEL (production-safe)
      if (keyOrPattern.includes('*')) {
        const keys: string[] = [];
        let cursor = '0';

        // Use SCAN instead of KEYS (production-safe for large datasets)
        do {
          const [newCursor, matchedKeys] = await client.scan(
            cursor,
            'MATCH',
            keyOrPattern,
            'COUNT',
            100
          );
          cursor = newCursor;
          keys.push(...matchedKeys);
        } while (cursor !== '0');

        if (keys.length === 0) return 0;

        // Delete in batches of 100
        let deleted = 0;
        for (let i = 0; i < keys.length; i += 100) {
          const batch = keys.slice(i, i + 100);
          deleted += await client.del(...batch);
        }

        return deleted;
      }

      // Single key deletion
      return await client.del(keyOrPattern);
    } catch (error) {
      console.error(`❌ Redis DEL error for pattern "${keyOrPattern}":`, error instanceof Error ? error.message : error);
      return 0;
    }
  }

  /**
   * Delete all keys matching a pattern (uses SCAN)
   */
  static async delPattern(pattern: string): Promise<number> {
    return this.del(pattern);
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      if (!key || key.includes('undefined') || key.includes('null')) {
        return false;
      }

      const connected = await ensureConnection();
      if (!connected) return false;

      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key "${key}":`, error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Get TTL for a key (in seconds)
   */
  static async ttl(key: string): Promise<number> {
    try {
      if (!key || key.includes('undefined') || key.includes('null')) {
        return -2;
      }

      const connected = await ensureConnection();
      if (!connected) return -2;

      const client = getRedisClient();
      return await client.ttl(key);
    } catch (error) {
      console.error(`❌ Redis TTL error for key "${key}":`, error instanceof Error ? error.message : error);
      return -2;
    }
  }

  /**
   * Check Redis memory usage (monitoring utility)
   * Returns used memory in MB, or null if unavailable
   */
  static async checkMemoryUsage(): Promise<{ usedMB: number; maxMB: number; percentage: number } | null> {
    try {
      const connected = await ensureConnection();
      if (!connected) return null;

      const client = getRedisClient();
      const info = await client.info('memory');

      // Parse used_memory from INFO output
      const usedMatch = info.match(/used_memory:(\d+)/);
      const maxMatch = info.match(/maxmemory:(\d+)/);

      if (!usedMatch) return null;

      const usedBytes = parseInt(usedMatch[1], 10);
      const maxBytes = maxMatch ? parseInt(maxMatch[1], 10) : 31457280; // Default 30MB for Redis Cloud free
      
      const usedMB = usedBytes / 1024 / 1024;
      const maxMB = maxBytes / 1024 / 1024;
      const percentage = (usedMB / maxMB) * 100;

      // Warn if usage > 20MB (out of 30MB)
      if (usedMB > 20) {
        console.warn(`⚠️ Redis memory usage HIGH: ${usedMB.toFixed(2)}MB / ${maxMB.toFixed(2)}MB (${percentage.toFixed(1)}%)`);
      }

      return {
        usedMB: parseFloat(usedMB.toFixed(2)),
        maxMB: parseFloat(maxMB.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(1)),
      };
    } catch (error) {
      console.error('❌ Redis memory check error:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Disconnect Redis client (for cleanup)
   */
  static async disconnect(): Promise<void> {
    try {
      if (redisClient && isConnected) {
        await redisClient.quit();
        console.log('👋 Redis disconnected gracefully');
        isConnected = false;
      }
    } catch (error) {
      console.error('❌ Redis disconnect error:', error instanceof Error ? error.message : error);
    }
  }
}

// Export the client for advanced operations if needed
export default getRedisClient;
