# Vercel Performance Optimization Plan

## Executive Summary

**Goal**: Reduce API response times from ~500ms–5s → ~50–300ms on Vercel (India users)

**Root Causes of Slowness**:

1. No Vercel region set → functions may deploy in US/EU instead of Mumbai
2. Every request hits MongoDB even for repeated identical data (no Redis on many routes)
3. No `Cache-Control` headers → Vercel CDN doesn't know what to do
4. Some routes do sequential DB calls that can run in parallel
5. Cold start: MongoDB + Redis reconnection on first request in a serverless instance

---

## Architecture: Correct Caching Hierarchy

```
User Request
    ↓
Vercel Edge CDN
    ↓ (miss — all routes are auth'd, so CDN NEVER serves stale user data)
Vercel Serverless Function (bom1 - Mumbai)
    ↓
Redis Cache (per-user key, TTL 30–120s)
    ↓ (miss)
MongoDB (pooled connection, maxPoolSize=10)
    ↓
Response with proper Cache-Control headers
```

> **IMPORTANT**: Since ALL routes use Bearer token authentication, we CANNOT use
> `public, s-maxage=60` CDN caching. That would serve one user's data to another user.
> The correct approach is per-user Redis caching + `Cache-Control: private, no-store`.

---

## Changes Made

### 1. `vercel.json` — Mumbai Region (Biggest Win 🏆)

**File**: `/vercel.json`

Without this, Vercel routes Indian users to US/EU servers → +200ms latency.
Setting `bom1` places functions in Mumbai, closest to Indian users.

```json
{
  "regions": ["bom1"],
  "functions": {
    "app/api/**": { "maxDuration": 30 }
  }
}
```

**Expected gain**: ~150–250ms reduction in latency for Indian users.

---

### 2. `next.config.ts` — Global Cache-Control Headers

Without explicit headers, Vercel CDN has no guidance. We add:

- `private, no-store` for all `/api/*` routes → tells CDN and browsers not to cache auth'd data
- `no-store` prevents sensitive user data from being accidentally cached anywhere

**Expected gain**: Prevents CDN confusion, improves security.

---

### 3. `lib/cache/with-cache.ts` — Per-User Redis Cache Utility

A clean wrapper that:

- Takes a cache key builder + TTL
- Checks Redis first (5–20ms)
- Falls back to the actual DB handler
- Stores result in Redis
- Returns response with proper headers

**Expected gain**: Repeated API calls (e.g. dashboard page load calling same endpoint 3x) go from ~300ms → ~10ms.

---

### 4. Admin Stats Route — Redis Caching Added

`/api/admin/users/get` currently runs:

- `User.aggregate(...)` — slow
- `Store.countDocuments({})`
- `Site.countDocuments({})`
- `Racee.countDocuments({ status: "pending" })`

These are already in `Promise.all` for the last 3, but there's no Redis cache.
Added Redis cache with 60s TTL (stats data doesn't change every second).

**Expected gain**: 300ms → 15ms for repeated dashboard loads.

---

### 5. Admin Users List Route — Redis + Promise.all Optimization

`/api/admin/users` route runs:

- `User.find(filter).lean()` — sequential
- `User.countDocuments(filter)` — sequential

Changed to `Promise.all([User.find(...), User.countDocuments(...)])` + Redis cache (30s TTL).

**Expected gain**: ~200ms → ~100ms (DB); ~5ms on Redis hit.

---

### 6. `export const dynamic = "force-dynamic"` — All GET Routes

Next.js App Router may try to statically optimize routes that don't explicitly read dynamic values.
Added `dynamic = "force-dynamic"` to all GET routes to prevent unexpected static caching.

---

## Performance Targets After Optimization

| Metric                   | Before            | After              |
| ------------------------ | ----------------- | ------------------ |
| Cold start latency       | ~1000ms           | ~400ms             |
| API response (Redis hit) | ~300ms            | ~20ms              |
| API response (DB hit)    | ~500ms            | ~200ms             |
| Latency from India       | +200ms US penalty | ~10ms bom1 penalty |

---

## Files Changed

| File                               | Change                                            |
| ---------------------------------- | ------------------------------------------------- |
| `vercel.json`                      | NEW — Mumbai region, 30s max duration             |
| `next.config.ts`                   | Added global `Cache-Control` headers for `/api/*` |
| `lib/cache/with-cache.ts`          | NEW — per-user Redis cache utility                |
| `app/api/admin/users/get/route.ts` | Added Redis cache (60s TTL)                       |
| `app/api/admin/users/route.ts`     | Added Promise.all + Redis cache (30s TTL)         |

---

## What We Did NOT Do (Intentionally)

| Rejected Approach               | Reason                                                            |
| ------------------------------- | ----------------------------------------------------------------- |
| `public, s-maxage=60` CDN cache | All routes are auth'd → would cause data leaks                    |
| Edge Runtime                    | All routes use MongoDB driver (Node.js only)                      |
| Cache every route               | Some routes (orders, carts) change frequently — stale data is bad |

---

## Monitoring

After deploying, check Vercel Function Logs:

- Look for `[REDIS CACHE HIT]` vs `[FROM MONGODB]` log lines
- Check Vercel Analytics → API Route Performance tab
- Use k6 load test (`k6 run test.js`) with real credentials to benchmark

---

## Future Improvements (Phase 2)

- Add Redis caching to `brand/stores/get`, `manager/stores`, `vendor/orders` routes
- Use `Promise.all` in any route that has sequential `await` DB calls
- Add Upstash Redis (Vercel-native, same region as `bom1`) instead of external Redis
- Consider `@vercel/kv` for simpler Redis integration on Vercel
