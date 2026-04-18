# Brand BFF Optimization — Full Implementation Summary

> **Objective**: Optimize all `/brand` section components using BFF (Backend for Frontend) layout, Redis caching with pub/sub, and SSE (Server-Sent Events) for real-time updates.

---

## Architecture Overview

```
Frontend (React)
  └─ lib/hooks/brand/*       ← SWR + SSE hooks
       └─ /api/brand/bff/*   ← BFF aggregation routes (single request, multiple DB queries)
       └─ /api/brand/*/sse   ← SSE streaming endpoints (Redis pub/sub)
       └─ /api/brand/**      ← Individual API routes with Redis cache-aside

Controller Layer (modules/brands/*)
  └─ *.service.ts            ← Pure DB queries (Mongoose, .lean())
  └─ *.controller.ts         ← Redis cache-aside + pub/sub publish

Cache Layer (Redis)
  └─ lib/utils/brand-cache-keys.ts   ← All cache keys & TTLs (single source of truth)
  └─ lib/utils/pubsub.ts             ← Dedicated pub/sub connections (separate from main Redis)
  └─ lib/utils/sseFactory.ts         ← Reusable SSE ReadableStream factory
```

---

## Phase 1 — Core Utilities

### `lib/utils/brand-cache-keys.ts`
Single source of truth for all brand Redis keys, TTLs, and SSE channel names.

| Resource           | Cache Key Pattern                    | TTL    |
|--------------------|--------------------------------------|--------|
| cart               | `brand:v1:cart:{userId}`             | 30 min |
| orders             | `brand:v1:orders:{brandId}`          | 1 min  |
| tenders            | `brand:v1:tenders:{brandId}`         | 2 min  |
| stores             | `brand:v1:stores:{brandId}`          | 5 min  |
| racee              | `brand:v1:racee:{brandId}`           | 2 min  |
| rates              | `brand:v1:rates:{brandId}`           | 10 min |
| purchaseAuthority  | `brand:v1:purchase-auth:{brandId}`   | 15 min |
| storeAuthority     | `brand:v1:store-auth:{brandId}`      | 15 min |
| rolePermissions    | `brand:v1:role-perms:{brandId}`      | 15 min |
| userRoles          | `brand:v1:user-roles:{brandId}`      | 15 min |
| checkoutInit (BFF) | `brand:v1:checkout-init:{brandId}`   | 5 min  |

### `lib/utils/pubsub.ts`
Dedicated Redis publisher/subscriber connections (ioredis pub/sub requires separate connections from query connections).
- `getPublisher()` — singleton publisher
- `publish(channel, payload)` — publish JSON to channel
- `createSubscriber(channel, onMessage)` — create subscriber for a channel

### `lib/utils/sseFactory.ts`
Reusable SSE response factory using Redis pub/sub.
- 25s heartbeat to prevent proxy timeouts
- Auto-cleanup on client disconnect
- `createSSEResponse(channel, abortSignal, initialData?)`

---

## Phase 2 — Service + Controller Modules

All modules follow this structure:
```
modules/brands/{resource}/
  ├── {resource}.service.ts     ← Pure DB queries, no auth/HTTP
  └── {resource}.controller.ts  ← Cache-aside + cache invalidation + pub/sub
```

### Modules Created

| Module              | Service Exports                   | Controller Exports                                    |
|---------------------|-----------------------------------|-------------------------------------------------------|
| orders              | `getOrdersByBrand`, `createOrder` | `getOrdersController`, `createOrderController`, `invalidateOrdersCache` |
| tenders             | `getTendersByBrand`, `createTender` | `getTendersController`, `createTenderController`, `invalidateTendersCache` |
| racee               | `getRaceeByBrand`                 | `getRaceeController`, `invalidateRaceeCache`          |
| rates               | `getRatesByBrand`                 | `getRatesController`, `invalidateRatesCache`          |
| cart                | `getCartByUser`                   | `getCartController`, `invalidateCartCache`            |
| purchase-authority  | `getPurchaseAuthoritiesByBrand`   | `getPurchaseAuthorityController`, `invalidatePurchaseAuthorityCache` |
| store-authority     | `getStoreAuthoritiesByBrand`      | `getStoreAuthorityController`, `invalidateStoreAuthorityCache` |
| role-permissions    | `getRolePermissionsByBrand`       | `getRolePermissionsController`, `invalidateRolePermissionsCache` |
| user-roles          | `getUserRolesByBrand`             | `getUserRolesController`, `invalidateUserRolesCache`  |

---

## Phase 3 — GET Routes Updated (Redis Cache-Aside)

| Route                                        | Controller Used                  |
|----------------------------------------------|----------------------------------|
| `app/api/brand/orders/route.ts` GET          | `getOrdersController`            |
| `app/api/brand/tenders/route.ts` GET         | `getTendersController`           |
| `app/api/brand/racee/route.ts` GET           | `getRaceeController`             |
| `app/api/brand/rates/get/route.ts`           | `getRatesController`             |
| `app/api/brand/cart/route.ts` GET            | `getCartController`              |
| `app/api/brand/purchase-authority/get/route.ts` | `getPurchaseAuthorityController` |
| `app/api/brand/role-permissions/get/route.ts`| `getRolePermissionsController`   |
| `app/api/brand/store-authority/get/route.ts` | `getStoreAuthorityController`    |
| `app/api/brand/user-roles/get/route.ts`      | `getUserRolesController`         |

### Mutation Routes Updated (Cache Invalidation)

All mutation routes (POST/PUT/PATCH/DELETE) now call the corresponding `invalidate*Cache()` function after successful save.

| Routes                                                                    | Invalidation Function             |
|---------------------------------------------------------------------------|-----------------------------------|
| `orders/route.ts` POST                                                    | `invalidateOrdersCache` + publishes SSE |
| `tenders/route.ts` POST                                                   | `invalidateTendersCache` + publishes SSE |
| `racee/post`, `racee/approve`, `racee/reject`, `racee/delete`             | `invalidateRaceeCache`            |
| `cart/route.ts` POST/PUT/DELETE                                           | `invalidateCartCache`             |
| `rates/post`, `rates/put`, `rates/delete`                                 | `invalidateRatesCache`            |
| `purchase-authority/post`, `put`                                          | `invalidatePurchaseAuthorityCache`|
| `store-authority/post`, `put`, `delete`                                   | `invalidateStoreAuthorityCache`   |
| `role-permissions/post`, `put`, `delete`                                  | `invalidateRolePermissionsCache`  |
| `user-roles/post`, `put`, `delete`                                        | `invalidateUserRolesCache`        |

---

## Phase 4 — BFF Aggregation Routes

### `app/api/brand/bff/checkout-init/route.ts`
**Problem solved**: `checkout/page.tsx` was making 2 separate API calls on mount  
**Solution**: Single BFF endpoint that runs both in parallel via `Promise.all()`

```
GET /api/brand/bff/checkout-init
Returns: {
  data: {
    purchaseAuthorities: [...],   ← from purchase-authority.controller (Redis cached)
    creativeManagers: [...]        ← from TeamMember model (Redis cached 5 min)
  }
}
```

---

## Phase 5 — SSE Endpoints

Real-time event streaming via Redis pub/sub → SSE.

| SSE Route                           | Pub/Sub Channel                    | Triggered By                     |
|-------------------------------------|------------------------------------|----------------------------------|
| `app/api/brand/orders/sse/route.ts` | `brand:sse:orders:{brandId}`       | `createOrderController` (POST)   |
| `app/api/brand/tenders/sse/route.ts`| `brand:sse:tenders:{brandId}`      | `createTenderController` (POST)  |
| `app/api/brand/racee/sse/route.ts`  | `brand:sse:racee:{brandId}`        | `invalidateRaceeCache` (any mutation) |

**SSE Event format**:
```
event: update
data: {"event":"orders:updated","brandId":"...","timestamp":"..."}

event: heartbeat  
data: {"ts":1234567890}
```

---

## Phase 6 — Frontend Hooks (`lib/hooks/brand/`)

| Hook                      | Endpoint                           | SSE          | Purpose                                    |
|---------------------------|------------------------------------|--------------|--------------------------------------------|
| `useBrandOrders.ts`       | `/api/brand/orders`                | ✅ orders/sse | Orders list with real-time updates         |
| `useBrandTenders.ts`      | `/api/brand/tenders`               | ✅ tenders/sse| Tenders list with real-time updates        |
| `useBrandRacee.ts`        | `/api/brand/racee`                 | ✅ racee/sse  | RACEE list with real-time updates + filters|
| `useBrandCheckoutInit.ts` | `/api/brand/bff/checkout-init`     | ❌           | BFF hook: purchase authorities + managers  |
| `useBrandRates.ts`        | `/api/brand/rates/get`             | ❌           | Brand rates (long-lived cache 10 min)       |
| `useBrandCart.ts`         | `/api/brand/cart`                  | ❌           | Cart data                                  |

### Hook Usage Pattern (SWR + SSE)

```typescript
// SWR fetches initial data from Redis-cached endpoint
const { data, mutate } = useSWR([url, token], fetcher);

// EventSource subscribes to SSE endpoint
// On "update" event → triggers mutate() to refetch from Redis
es.addEventListener('update', () => mutate());
```

---

## Checkout Page Update

**File**: `app/(user)/brand/checkout/page.tsx`

**Before**: 2 separate `useEffect` hooks fetching on mount:
```typescript
// useEffect 1: fetch('/api/brand/purchase-authority/get')
// useEffect 2: fetch('/api/teams/members?uniqueKey=creativeManagers...')
```

**After**: Single BFF hook:
```typescript
import { useBrandCheckoutInit } from '@/lib/hooks/brand/useBrandCheckoutInit';

const { purchaseAuthorities: fetchedAuthorities, creativeManagers: fetchedManagers } =
  useBrandCheckoutInit();

// Synced into local state for backward compatibility with existing handlers
useEffect(() => { if (fetchedAuthorities.length > 0) setPurchaseAuthorities(fetchedAuthorities); }, [fetchedAuthorities]);
useEffect(() => { if (fetchedManagers.length > 0) setCreativeManagers(fetchedManagers); }, [fetchedManagers]);
```

**Result**: 2 network requests on mount → 1 request (parallel DB queries on server side)

---

## Files Created (New)

### Utilities (3 files)
- `lib/utils/brand-cache-keys.ts`
- `lib/utils/pubsub.ts`
- `lib/utils/sseFactory.ts`

### Modules (18 files — 9 service + 9 controller)
- `modules/brands/orders/orders.service.ts` + `orders.controller.ts`
- `modules/brands/tenders/tenders.service.ts` + `tenders.controller.ts`
- `modules/brands/racee/racee.service.ts` + `racee.controller.ts`
- `modules/brands/rates/rates.service.ts` + `rates.controller.ts`
- `modules/brands/cart/cart.service.ts` + `cart.controller.ts`
- `modules/brands/purchase-authority/purchase-authority.service.ts` + `purchase-authority.controller.ts`
- `modules/brands/store-authority/store-authority.service.ts` + `store-authority.controller.ts`
- `modules/brands/role-permissions/role-permissions.service.ts` + `role-permissions.controller.ts`
- `modules/brands/user-roles/user-roles.service.ts` + `user-roles.controller.ts`

### BFF Routes (1 file)
- `app/api/brand/bff/checkout-init/route.ts`

### SSE Routes (3 files)
- `app/api/brand/orders/sse/route.ts`
- `app/api/brand/tenders/sse/route.ts`
- `app/api/brand/racee/sse/route.ts`

### Frontend Hooks (6 files)
- `lib/hooks/brand/useBrandOrders.ts`
- `lib/hooks/brand/useBrandTenders.ts`
- `lib/hooks/brand/useBrandRacee.ts`
- `lib/hooks/brand/useBrandCheckoutInit.ts`
- `lib/hooks/brand/useBrandRates.ts`
- `lib/hooks/brand/useBrandCart.ts`

**Total new files: 31**

---

## Files Modified (Existing)

| File                                                      | Change                                        |
|-----------------------------------------------------------|-----------------------------------------------|
| `app/api/brand/orders/route.ts`                           | GET → controller; POST → controller + pub/sub |
| `app/api/brand/tenders/route.ts`                          | GET → controller; POST → controller + pub/sub |
| `app/api/brand/racee/route.ts`                            | GET → controller                              |
| `app/api/brand/rates/get/route.ts`                        | Replaced with controller                      |
| `app/api/brand/rates/post/route.ts`                       | Added `invalidateRatesCache`                  |
| `app/api/brand/rates/put/route.ts`                        | Added `invalidateRatesCache`                  |
| `app/api/brand/rates/delete/route.ts`                     | Added `invalidateRatesCache`                  |
| `app/api/brand/cart/route.ts`                             | GET → controller; POST/PUT/DELETE → invalidate|
| `app/api/brand/purchase-authority/get/route.ts`           | Replaced with controller                      |
| `app/api/brand/purchase-authority/post/route.ts`          | Added `invalidatePurchaseAuthorityCache`       |
| `app/api/brand/purchase-authority/put/route.ts`           | Added `invalidatePurchaseAuthorityCache`       |
| `app/api/brand/store-authority/get/route.ts`              | Replaced with controller (new cache key)      |
| `app/api/brand/store-authority/post/route.ts`             | Switched to controller's invalidation fn      |
| `app/api/brand/store-authority/put/route.ts`              | Switched to controller's invalidation fn      |
| `app/api/brand/store-authority/delete/route.ts`           | Switched to controller's invalidation fn      |
| `app/api/brand/role-permissions/get/route.ts`             | Replaced with controller                      |
| `app/api/brand/role-permissions/post/route.ts`            | Added `invalidateRolePermissionsCache`        |
| `app/api/brand/role-permissions/put/route.ts`             | Added `invalidateRolePermissionsCache`        |
| `app/api/brand/role-permissions/delete/route.ts`          | Added `invalidateRolePermissionsCache`        |
| `app/api/brand/user-roles/get/route.ts`                   | Replaced with controller (new cache key)      |
| `app/api/brand/user-roles/post/route.ts`                  | Switched to controller's invalidation fn      |
| `app/api/brand/user-roles/put/route.ts`                   | Switched to controller's invalidation fn      |
| `app/api/brand/user-roles/delete/route.ts`                | Switched to controller's invalidation fn      |
| `app/api/brand/racee/post/route.ts`                       | Added `invalidateRaceeCache`                  |
| `app/api/brand/racee/approve/route.ts`                    | Added `invalidateRaceeCache`                  |
| `app/api/brand/racee/reject/route.ts`                     | Added `invalidateRaceeCache`                  |
| `app/api/brand/racee/delete/route.ts`                     | Added `invalidateRaceeCache`                  |
| `app/(user)/brand/checkout/page.tsx`                      | Replaced 2 useEffects with `useBrandCheckoutInit` |

**Total modified files: 28**

---

## Performance Impact

| Metric                        | Before           | After                          |
|-------------------------------|------------------|--------------------------------|
| DB hits per GET request       | Always 1+        | 0 on cache hit (TTL-based)     |
| Network requests (checkout)   | 2 parallel       | 1 (BFF aggregated)             |
| Real-time updates             | Manual refresh   | Auto (SSE push on mutation)    |
| Business logic location       | route.ts         | service.ts + controller.ts     |
| Cache consistency             | None             | Invalidated on every mutation  |
