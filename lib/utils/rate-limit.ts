import { NextRequest, NextResponse } from "next/server";
import { RedisCache } from "@/lib/db/redis";

type RateLimitOptions = {
  namespace: string;
  maxRequests: number;
  windowMs: number;
  key?: string;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
};

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function buildKey(req: NextRequest, options: RateLimitOptions): string {
  const suffix = options.key?.trim() || getClientIp(req);
  return `rl:v1:${options.namespace}:${suffix}`;
}

export async function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const cacheKey = buildKey(req, options);

  const existing = await RedisCache.get<RateLimitState>(cacheKey);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + options.windowMs;
    const ttlSec = Math.max(1, Math.ceil(options.windowMs / 1000));

    await RedisCache.set(
      cacheKey,
      {
        count: 1,
        resetAt,
      },
      ttlSec,
    );

    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - 1),
      retryAfterSec: ttlSec,
    };
  }

  if (existing.count >= options.maxRequests) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );
    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      retryAfterSec,
    };
  }

  const nextState: RateLimitState = {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  };
  const ttlSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  await RedisCache.set(cacheKey, nextState, ttlSec);

  return {
    allowed: true,
    limit: options.maxRequests,
    remaining: Math.max(0, options.maxRequests - nextState.count),
    retryAfterSec: ttlSec,
  };
}

export function rateLimitExceededResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
      limit: result.limit,
      remaining: result.remaining,
      retryAfterSec: result.retryAfterSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSec),
      },
    },
  );
}
