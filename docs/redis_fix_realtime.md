# Redis Cache Real-Time Fix Plan

## Problem Statement

Data updated by one role (vendor/brand/admin) is NOT instantly reflected for other roles
because cache invalidation only clears the **writing role's own cache**, not related caches
for other roles that read the same underlying data.

---

## Root Cause Summary

```
Vendor accepts order → clears vendor:v1:orders:{vendorId}
                     → ❌ DOES NOT clear brand:v1:orders:{brandId}
                     → Brand sees stale status for up to 60s

Brand verifies order → ❌ NO cache invalidation at all
                     → Both brand AND vendor see stale status

Admin approves user  → ❌ admin:stats:v1 never cleared
                     → Dashboard shows wrong counts
```

---

## Gaps Found

| #   | Gap                                                                    | Severity    | Routes Affected                                                                                       |
| --- | ---------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Vendor order actions → brand order cache NOT cleared                   | 🔴 Critical | accept-order, reject-order, accept-escalation, raise-escalation, create-job-card                      |
| 2   | Brand order actions → ZERO cache invalidation                          | 🔴 Critical | verify-order, review-creative, respond-escalation, accept-escalation, reject-site, set-site-reference |
| 3   | Admin user approval → admin:stats:v1 never cleared                     | 🔴 Critical | /admin/users/approve, /admin/users/[userId]                                                           |
| 4   | Admin user approval → admin:users:v1:\* list never cleared             | 🔴 Critical | /admin/users/approve, /admin/users/[userId]                                                           |
| 5   | Brand accept-bid → tender cache (brand + vendor) not cleared           | 🟡 Medium   | /brand/tenders/accept-bid                                                                             |
| 6   | Brand cart/clear → cart Redis key not cleared                          | 🟡 Medium   | /brand/cart/clear                                                                                     |
| 7   | Brand assign-manager → manager:v1:stores:{managerId} not cleared       | 🟡 Medium   | /brand/stores/assign-manager POST/PUT/DELETE                                                          |
| 8   | Brand stores/bulk → brand:v1:stores:{brandId} not cleared              | 🟡 Medium   | /brand/stores/bulk                                                                                    |
| 9   | Brand user-role mutations → brand:authorities:v1:{brandId} not cleared | 🟡 Medium   | /brand/user-roles/post,put,delete                                                                     |
| 10  | Admin user-roles/role-perms PUT → no cache invalidation                | 🟡 Medium   | /admin/user-roles/put, /admin/role-permissions/put                                                    |

---

## Fix Architecture

### New helpers in `modules/manager/cache-invalidation.ts`

```ts
// Clear brand order cache given a brandId
invalidateBrandOrdersCache(brandId: string)

// Clear vendor order cache given an Order document (which has vendorId)
invalidateVendorOrdersCacheByOrder(orderId: string)

// Clear admin stats + paginated user list
invalidateAdminUserCaches()
```

### Invalidation Rules (What-Clears-What)

```
Vendor mutates order (accept/reject/escalate):
  ├── vendor:v1:orders:{vendorId}    [already done ✅]
  └── brand:v1:orders:{brandId}      [NEW - fetch brandId from Order doc]

Brand mutates order (verify/review/respond/reject-site/set-ref):
  ├── brand:v1:orders:{brandId}      [NEW]
  └── vendor:v1:orders:{vendorId}    [NEW - fetch vendorId from Order doc]

Brand accept-bid on tender:
  ├── brand:v1:tenders:{brandId}     [NEW]
  └── vendor:v1:tenders:{vendorId}   [NEW - fetch vendorId from Tender doc]

Brand clear cart:
  └── brand:v1:cart:{brandId}        [NEW]

Brand assign-manager POST/PUT/DELETE:
  └── manager:v1:stores:{managerId}  [NEW]

Brand stores/bulk POST:
  └── brand:v1:stores:{brandId}      [NEW]

Brand user-roles post/put/delete:
  ├── manager:v1:authorities:{parentId}      [already ✅]
  ├── manager:v1:role-perms:{managerId}.*    [already ✅]
  └── brand:authorities:v1:{brandId}         [NEW]

Admin approve/update user:
  ├── admin:stats:v1                         [NEW]
  └── admin:users:v1:*                       [NEW - pattern delete]

Admin user-roles PUT:
  └── admin:v1:user-roles:{adminId}          [NEW]

Admin role-permissions PUT:
  └── admin:v1:role-perms:{adminId}          [NEW]
```

---

## Files to Change (20 files)

### Group A — Helper expansion (1 file)

- `modules/manager/cache-invalidation.ts` — add 3 new helpers

### Group B — Vendor order action routes (5 files)

- `app/api/vendor/orders/accept-order/route.ts`
- `app/api/vendor/orders/reject-order/route.ts`
- `app/api/vendor/orders/accept-escalation/route.ts`
- `app/api/vendor/orders/raise-escalation/route.ts`
- `app/api/vendor/orders/create-job-card/route.ts`

### Group C — Brand order action routes (6 files)

- `app/api/brand/orders/verify-order/route.ts`
- `app/api/brand/orders/review-creative/route.ts`
- `app/api/brand/orders/respond-escalation/route.ts`
- `app/api/brand/orders/accept-escalation/route.ts`
- `app/api/brand/orders/reject-site/route.ts`
- `app/api/brand/orders/set-site-reference/route.ts`

### Group D — Admin routes (4 files)

- `app/api/admin/users/approve/route.ts`
- `app/api/admin/users/[userId]/route.ts`
- `app/api/admin/user-roles/put/route.ts`
- `app/api/admin/role-permissions/put/route.ts`

### Group E — Other gaps (4 files)

- `app/api/brand/tenders/accept-bid/route.ts`
- `app/api/brand/cart/clear/route.ts`
- `app/api/brand/stores/assign-manager/route.ts`
- `app/api/brand/stores/bulk/route.ts`

### Group F — Brand authorities + user-roles (3 files)

- `app/api/brand/user-roles/post/route.ts`
- `app/api/brand/user-roles/put/route.ts`
- `app/api/brand/user-roles/delete/route.ts`

---

## TTL Strategy (No Changes)

All TTLs are already correct. No TTL = 0 will be used.

| Cache                   | TTL   | Rationale                   |
| ----------------------- | ----- | --------------------------- |
| orders (brand/vendor)   | 60s   | Near-real-time order status |
| tenders                 | 120s  | Slightly less critical      |
| stores                  | 300s  | Infrequent changes          |
| rates                   | 600s  | Master data                 |
| role-perms / user-roles | 900s  | Config data                 |
| admin:stats:v1          | 60s   | Short enough                |
| admin:users:v1:\*       | 30s   | Short enough                |
| cart                    | 1800s | Session-like                |

---

## Implementation Status

- [x] Plan created
- [ ] Group A: Helper expansion
- [ ] Group B: Vendor order routes
- [ ] Group C: Brand order routes
- [ ] Group D: Admin routes
- [ ] Group E: Other gaps
- [ ] Group F: Brand authorities
- [ ] Build verification
