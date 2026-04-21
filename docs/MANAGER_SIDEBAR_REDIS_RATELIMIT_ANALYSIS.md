# Assign Manager + Manager Sidebar Stale Data Analysis

Date: April 21, 2026

## 1) Kya `assign-manager-modal.tsx` ka data Redis mein store hota hai?

Short answer: **Nahi (previously)**.

`assign-manager-modal.tsx` yeh endpoints call karta hai:

- `GET /api/teams/manager-types`
- `GET /api/teams/members?uniqueKey=...`
- `GET /api/brand/stores/assign-manager?storeIds=...&checkUsed=true`
- `POST /api/brand/stores/assign-manager`

In routes mein pehle Redis cache-aside (`getOrSetCache`) use nahi ho raha tha. Yeh mostly direct MongoDB reads/writes the.

## 2) Manager sidebar stale kyu ho raha tha?

### Symptom

- Brand ne role/permission change kiya.
- Brand sidebar updated dikh gaya.
- Manager sidebar real-time update nahi hua.
- Redis key delete karke refresh kiya tab update dikh gaya.

### Root Cause

Manager sidebar do cached APIs se banta hai:

- `GET /api/manager/teams/authorities` -> key: `manager:v1:authorities:{parentId}`
- `GET /api/manager/role-permissions` -> key: `manager:v1:role-perms:{managerId}`

Issue yeh tha ki brand-side mutation routes (user-roles / role-permissions CRUD) **sirf brand cache invalidate kar rahe the**, manager-side cache invalidate nahi kar rahe the.

Isliye stale Redis values manager ko milti rahi jab tak TTL expire na ho ya key manually delete na karo.

## 3) Iska fix kya kiya gaya?

### A) Cross-module cache invalidation add kiya

New helper:

- `modules/manager/cache-invalidation.ts`

Helper behavior:

- `manager:v1:authorities:{parentId}` delete karta hai
- Brand ke active managers find karta hai (`TeamMember` by `parentId`)
- Har manager ka `manager:v1:role-perms:{managerId}` delete karta hai

Is helper ko brand mutation routes mein call kiya gaya:

- `app/api/brand/user-roles/post/route.ts`
- `app/api/brand/user-roles/put/route.ts`
- `app/api/brand/user-roles/delete/route.ts`
- `app/api/brand/role-permissions/post/route.ts`
- `app/api/brand/role-permissions/put/route.ts`
- `app/api/brand/role-permissions/delete/route.ts`

Result: Brand change ke baad manager sidebar next request par fresh data pick karega.

### B) Rate limit add kiya (as requested)

New utility:

- `lib/utils/rate-limit.ts`

Rate limit applied on APIs used by assign-manager flow:

- `app/api/brand/stores/assign-manager/route.ts`
  - GET: 120 req/min/user
  - POST: 40 req/min/user
  - PUT: 60 req/min/user
  - DELETE: 60 req/min/user
- `app/api/teams/manager-types/route.ts`
  - GET: 90 req/min/user
- `app/api/teams/members/route.ts`
  - GET: 120 req/min/user
  - POST: 30 req/min/user

Response on throttle:

- HTTP `429`
- JSON with `retryAfterSec`
- `Retry-After` response header

## 4) Why this resolves your exact issue

Aapka observed behavior (Redis key manually delete karne ke baad manager sidebar update aana) clearly stale-cache invalidation gap indicate karta tha. Ab brand-side mutations direct manager cache keys bhi invalidate karte hain, to stale state persist nahi karegi.

## 5) Notes

- Assign-manager flow pe ab defensive rate-limit hai, abuse/spike se DB bachti hai.
- Yeh change authentication ke baad user-scoped keys par based hai, isliye fair throttling hoti hai.
