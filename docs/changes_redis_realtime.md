# Redis Real-Time Cache Fix — Change Log

**Date:** April 22, 2026  
**Branch:** main  
**Build Status:** ✅ Passed (`pnpm build` — exit code 0)  
**Type Check:** ✅ Passed (`pnpm tsc --noEmit` — exit code 0)

---

## Problem Summary

Redis cache-aside pattern was implemented correctly for **reads** (GET routes), but **write routes** were not invalidating cache across roles. This caused stale data — for example, a vendor accepting an order would update their own cache but the brand would still see the old status for minutes until TTL expired.

**10 gaps were identified and all have been fixed.**

---

## Files Changed

### 1. `modules/manager/cache-invalidation.ts` — New Helper Functions Added

**Why:** Centralized place for cross-role cache invalidation. Previously only had `invalidateManagerSidebarCacheByParent`. Added 4 new exported helpers:

| Function                                 | Cache Key Cleared                     | Used By             |
| ---------------------------------------- | ------------------------------------- | ------------------- |
| `invalidateBrandOrdersCache(brandId)`    | `brand:v1:orders:{brandId}`           | Vendor order routes |
| `invalidateVendorOrdersCache(vendorId)`  | `vendor:v1:orders:{vendorId}`         | Brand order routes  |
| `invalidateVendorTendersCache(vendorId)` | `vendor:v1:tenders:{vendorId}`        | Brand tender routes |
| `invalidateAdminUserCaches()`            | `admin:stats:v1` + `admin:users:v1:*` | Admin user routes   |

---

### 2. GAP 1 — Vendor Order Mutations → Brand Cache NOT Cleared

**Problem:** When vendor accepted/rejected/escalated an order, only `vendor:v1:orders:{vendorId}` was cleared. Brand's cached order list was NOT cleared, so brand saw stale order status.

**Files Fixed:**

| File                                               | Change                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `app/api/vendor/orders/accept-order/route.ts`      | Added `invalidateBrandOrdersCache(order.brandId)` after `invalidateOrdersCache`    |
| `app/api/vendor/orders/reject-order/route.ts`      | Added `invalidateBrandOrdersCache(order.brandId)` after `invalidateOrdersCache`    |
| `app/api/vendor/orders/raise-escalation/route.ts`  | Added `invalidateBrandOrdersCache(order.brandId)` after `invalidateOrdersCache`    |
| `app/api/vendor/orders/accept-escalation/route.ts` | Added `invalidateBrandOrdersCache(order.brandId)` after `invalidateOrdersCache`    |
| `app/api/vendor/orders/create-job-card/route.ts`   | Added import + `invalidateBrandOrdersCache(order.brandId)` after job card creation |

---

### 3. GAP 2 — Brand Order Mutations → ZERO Cache Invalidation

**Problem:** All brand-side order action routes had `order.save()` but zero cache invalidation. Neither brand nor vendor cache was cleared — both sides saw stale data.

**Files Fixed:**

| File                                               | Change                                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `app/api/brand/orders/verify-order/route.ts`       | Added `invalidateBrandOrdersCache(decoded.userId)` + `invalidateVendorOrdersCache(order.vendorId)` |
| `app/api/brand/orders/review-creative/route.ts`    | Added `invalidateBrandOrdersCache(brandId)` + `invalidateVendorOrdersCache(order.vendorId)`        |
| `app/api/brand/orders/respond-escalation/route.ts` | Added `invalidateBrandOrdersCache(brandId)` + `invalidateVendorOrdersCache(order.vendorId)`        |
| `app/api/brand/orders/set-site-reference/route.ts` | Added `invalidateBrandOrdersCache(decoded.userId)` + `invalidateVendorOrdersCache(order.vendorId)` |
| `app/api/brand/orders/reject-site/route.ts`        | Added `invalidateBrandOrdersCache(decoded.userId)` + `invalidateVendorOrdersCache(order.vendorId)` |
| `app/api/brand/orders/accept-escalation/route.ts`  | Added `invalidateBrandOrdersCache(brandId)` + `invalidateVendorOrdersCache(order.vendorId)`        |

---

### 4. GAP 3 + GAP 4 — Admin User Approval → Stats and User List Cache NOT Cleared

**Problem:** When admin approved a user (`user.adminApproval = true`), the admin stats dashboard (`admin:stats:v1`) and paginated user list (`admin:users:v1:*`) were never cleared. Admin saw old counts/statuses.

**File Fixed:**

| File                                   | Change                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `app/api/admin/users/approve/route.ts` | Added `invalidateAdminUserCaches()` after `user.save()` — clears both stats and user list |

---

### 5. GAP 5 — Brand Accept Bid → Tender Cache (Brand + Vendor) NOT Cleared

**Problem:** When brand accepted a vendor's bid on a tender, `tender.save()` was called but neither `brand:v1:tenders:{brandId}` nor `vendor:v1:tenders:{vendorId}` was cleared. Both parties saw stale tender status.

**File Fixed:**

| File                                        | Change                                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/api/brand/tenders/accept-bid/route.ts` | Added `RedisCache.del(BrandCacheKeys.tenders(decoded.userId))` + `RedisCache.del(VendorCacheKeys.tenders(vendorId))` after `tender.save()` |

---

### 6. GAP 6 — Brand Cart Clear → Cart Redis Key NOT Cleared

**Problem:** When brand cleared their cart (`cart.items = []` + `cart.save()`), the Redis key `brand:v1:cart:{brandId}` was never deleted. Brand's cart appeared non-empty from cache.

**File Fixed:**

| File                                | Change                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `app/api/brand/cart/clear/route.ts` | Added `RedisCache.del(BrandCacheKeys.cart(decoded.userId))` after `cart.save()` |

---

### 7. GAP 7 — Brand Assign-Manager Mutations → Manager Store Cache NOT Cleared

**Problem:** When brand assigned/updated a manager to a store (`StoreAssignManager.create` / `assignment.save()`), the manager's store list cache `manager:v1:stores:{managerId}` was never cleared. Manager saw stale store assignments.

**File Fixed:**

| File                                           | Change                                                                                                                                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/brand/stores/assign-manager/route.ts` | POST bulk loop: added `RedisCache.del(ManagerCacheKeys.stores(assignment.managerUserId))` per created assignment. PUT: added `RedisCache.del(ManagerCacheKeys.stores(assignment.managerUserId))` after `assignment.save()` |

---

### 8. GAP 8 — Brand Bulk Store Creation → Brand Store Cache NOT Cleared

**Problem:** Bulk store creation (`Store.create` in a loop) never cleared `brand:v1:stores:{brandId}`. Brand's store list showed old count/data from cache.

**File Fixed:**

| File                                 | Change                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `app/api/brand/stores/bulk/route.ts` | Added `RedisCache.del(BrandCacheKeys.stores(decoded.userId))` after successful bulk creation |

---

### 9. GAP 9 — Brand User-Role Mutations → `brand:authorities:v1:{userId}` NOT Cleared

**Problem:** POST/PUT/DELETE on brand user roles already called `invalidateUserRolesCache` and `invalidateManagerSidebarCacheByParent`, but did NOT clear the `brand:authorities:v1:{userId}` key (used by `/api/teams/authorities`). Team role list served from stale cache.

**Files Fixed:**

| File                                       | Change                                                           |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `app/api/brand/user-roles/post/route.ts`   | Added `invalidateCache("brand:authorities:v1:{userId}")`         |
| `app/api/brand/user-roles/put/route.ts`    | Added `invalidateCache("brand:authorities:v1:{decoded.userId}")` |
| `app/api/brand/user-roles/delete/route.ts` | Added `invalidateCache("brand:authorities:v1:{decoded.userId}")` |

---

### 10. GAP 10 — Admin Role/Permission Updates → Admin Cache NOT Cleared

**Problem:** When admin updated user roles or role permissions, the cached values `admin:v1:user-roles:{adminId}` and `admin:v1:role-perms:{adminId}` were never cleared.

**Files Fixed:**

| File                                          | Change                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `app/api/admin/user-roles/put/route.ts`       | Added `RedisCache.del(AdminCacheKeys.userRoles(decoded.userId))` after update             |
| `app/api/admin/role-permissions/put/route.ts` | Added `RedisCache.del(AdminCacheKeys.rolePermissions(decoded.userId))` after `updateMany` |

---

## Design Rules Followed

- All `RedisCache.del()` / `invalidate*()` calls are wrapped in `.catch(() => {})` — cache failure never breaks the API response
- No TTLs were changed
- No business logic was modified
- All cache keys use `v1` versioning — unchanged
- Only write routes were touched — GET/read routes unchanged

---

## Total Files Changed

| Category               | Files                                       |
| ---------------------- | ------------------------------------------- |
| New helpers            | 1 (`modules/manager/cache-invalidation.ts`) |
| Vendor order routes    | 5                                           |
| Brand order routes     | 6                                           |
| Admin routes           | 3                                           |
| Brand tender routes    | 1                                           |
| Brand cart routes      | 1                                           |
| Brand store routes     | 2                                           |
| Brand user-role routes | 3                                           |
| **Total**              | **22 files**                                |
