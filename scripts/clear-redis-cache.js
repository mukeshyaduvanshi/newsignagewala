/**
 * Clear Redis Cache Script
 * 
 * Run this after fixing team authority field names to clear old cached data
 * 
 * Usage:
 * node scripts/clear-redis-cache.js
 */

const Redis = require('ioredis');

async function clearUserRolesCache() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  console.log('Connecting to Redis...');
  const redis = new Redis(redisUrl);

  try {
    console.log('\n🔍 Searching for team authority cache keys...');
    
    // Find all team authority cache keys
    const pattern = 'sidebar:v1:team:*';
    let cursor = '0';
    let deletedCount = 0;
    const keys = [];

    do {
      const [newCursor, matchedKeys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = newCursor;
      keys.push(...matchedKeys);
    } while (cursor !== '0');

    console.log(`Found ${keys.length} team authority cache keys`);

    if (keys.length > 0) {
      console.log('\n🗑️  Deleting cache keys...');
      
      // Delete in batches of 100
      for (let i = 0; i < keys.length; i += 100) {
        const batch = keys.slice(i, i + 100);
        const deleted = await redis.del(...batch);
        deletedCount += deleted;
        console.log(`Deleted batch ${Math.floor(i / 100) + 1}: ${deleted} keys`);
      }

      console.log(`\n✅ Successfully deleted ${deletedCount} team authority cache keys`);
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser');
      console.log('2. Login again if needed');
      console.log('3. Team members should now appear in sidebar');
    } else {
      console.log('\n✅ No team authority cache keys found (cache already clear)');
    }

  } catch (error) {
    console.error('\n❌ Error clearing cache:', error.message);
    process.exit(1);
  } finally {
    await redis.quit();
    console.log('\n👋 Redis connection closed');
  }
}

clearUserRolesCache();
