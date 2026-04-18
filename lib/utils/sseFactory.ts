/**
 * SSE (Server-Sent Events) Factory
 *
 * createSSEResponse() ek ReadableStream banata hai jo:
 *  1. Redis pub/sub channel ko subscribe karta hai
 *  2. Har incoming message ko SSE format mein push karta hai
 *  3. Client disconnect hone par cleanly unsubscribe karta hai
 *  4. 25-second heartbeat bhejta hai taaki proxy/load-balancer timeout na ho
 *
 * Usage (SSE route file):
 * ─────────────────────────
 *   export const runtime = 'nodejs';
 *   export const dynamic = 'force-dynamic';
 *
 *   export async function GET(req: NextRequest) {
 *     const decoded = verifyAccessToken(...);
 *     if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *
 *     return createSSEResponse(
 *       BrandSSEChannels.orders(decoded.userId),
 *       req.signal,
 *     );
 *   }
 */

import { NextResponse } from "next/server";
import { createSubscriber } from "./pubsub";
import Redis from "ioredis";

/**
 * Build an SSE NextResponse that streams Redis pub/sub events to the client.
 *
 * @param channel      - Redis channel to subscribe to
 * @param abortSignal  - Request AbortSignal (req.signal from Next.js route)
 * @param initialData  - Optional payload sent immediately on connect
 */
export function createSSEResponse(
  channel: string,
  abortSignal: AbortSignal,
  initialData?: object,
): NextResponse {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let subscriber: Redis | null = null;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

      /** Push a formatted SSE message */
      function send(eventType: string, data: object) {
        const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Controller already closed (client disconnected)
        }
      }

      /** Cleanup: unsubscribe + clear timers */
      async function cleanup() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (subscriber) {
          try {
            await subscriber.unsubscribe(channel);
            subscriber.disconnect();
          } catch {
            // ignore
          }
          subscriber = null;
        }
        try {
          controller.close();
        } catch {
          // already closed
        }
      }

      // 1. Send initial data immediately on connect
      send("connected", { status: "connected", channel, ts: Date.now() });
      if (initialData) {
        send("init", initialData);
      }

      // 2. Heartbeat every 25 seconds
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          cleanup();
        }
      }, 25_000);

      // 3. Subscribe to Redis channel
      try {
        subscriber = await createSubscriber(channel, (message) => {
          try {
            const parsed = JSON.parse(message);
            send(parsed.type || "update", parsed);
          } catch {
            send("update", { raw: message });
          }
        });
      } catch (err) {
        console.warn(`⚠️ SSE: Could not subscribe to "${channel}":`, err);
        // Graceful fallback — stream stays open but won't get Redis events
      }

      // 4. Cleanup when client disconnects
      abortSignal.addEventListener("abort", () => {
        cleanup();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
