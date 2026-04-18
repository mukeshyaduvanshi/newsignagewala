/**
 * Redis Pub/Sub Helpers
 *
 * Pub/Sub ke liye ioredis requires a DEDICATED connection —
 * subscriber mode mein connection kisi aur kaam nahi aata.
 * Isliye yahan alag publisher + subscriber singletons hain.
 *
 * Usage:
 *   // Publish (from mutation route):
 *   await redisPub.publish(channel, JSON.stringify(payload));
 *
 *   // Subscribe (from SSE route):
 *   const sub = await createSubscriber(channel, (msg) => { ... });
 *   // cleanup:
 *   await sub.unsubscribe(channel);
 *   sub.disconnect();
 */

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// ─── Shared options ────────────────────────────────────────────────────────────
const baseOptions: import("ioredis").RedisOptions = {
  maxRetriesPerRequest: null, // pub/sub connections must NOT have a limit
  enableReadyCheck: false,
  lazyConnect: true,
  connectTimeout: 10000,
  retryStrategy(times: number) {
    if (times > 5) return null;
    return Math.min(times * 300, 3000);
  },
};

// ─── Publisher singleton ───────────────────────────────────────────────────────
let _publisher: Redis | null = null;

export function getPublisher(): Redis {
  if (!_publisher) {
    _publisher = new Redis(REDIS_URL, baseOptions);
    _publisher.on("error", (err) => {
      if (!err.message.includes("ECONNREFUSED")) {
        console.error("⚠️ Redis Publisher error:", err.message);
      }
    });
  }
  return _publisher;
}

/**
 * Publish a JSON payload to a Redis channel.
 * Gracefully swallowed if Redis is unavailable.
 */
export async function publish(channel: string, payload: object): Promise<void> {
  try {
    const pub = getPublisher();
    await pub.publish(channel, JSON.stringify(payload));
  } catch (err) {
    console.warn(`⚠️ Redis publish failed on channel "${channel}":`, err);
  }
}

// ─── Subscriber factory ────────────────────────────────────────────────────────

/**
 * Create a one-off subscriber for a single channel.
 * Returns the subscriber instance so the caller (SSE route) can clean up.
 *
 * @param channel   - Redis channel to subscribe to
 * @param onMessage - Callback with raw message string
 */
export async function createSubscriber(
  channel: string,
  onMessage: (message: string) => void,
): Promise<Redis> {
  const sub = new Redis(REDIS_URL, {
    ...baseOptions,
    maxRetriesPerRequest: null,
  });

  sub.on("error", (err) => {
    if (!err.message.includes("ECONNREFUSED")) {
      console.error(`⚠️ Redis Subscriber error [${channel}]:`, err.message);
    }
  });

  sub.on("message", (_ch: string, message: string) => {
    if (_ch === channel) onMessage(message);
  });

  try {
    await sub.subscribe(channel);
  } catch (err) {
    console.warn(`⚠️ Redis subscribe failed for channel "${channel}":`, err);
  }

  return sub;
}
