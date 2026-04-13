# BFF Layout — Single Next.js Project (Vercel Ready)
> Ek hi Next.js 14 project | app/api/ = BFF Layer | Vercel deploy

---

## Architecture (Single Project)

```
Browser
   │
   ▼
┌──────────────────────────────────────────────┐
│           Next.js 14 (Single App)            │
│                                              │
│  ┌─────────────────┐   ┌──────────────────┐  │
│  │  app/(pages)    │   │   app/api/ (BFF) │  │
│  │  SSR + RSC      │──▶│   Route Handlers │  │
│  │  Client comps   │   │   Auth, Cache,   │  │
│  └─────────────────┘   │   Aggregation    │  │
│                        └────────┬─────────┘  │
└─────────────────────────────────┼────────────┘
                                  │
                    ┌─────────────┼──────────┐
                    ▼             ▼          ▼
                 MongoDB        Redis     Fast2SMS/
                (Supabase)   (Upstash)   Nodemailer
```

---

## Pura Folder Structure

```
newsignagewala/
│
├── app/
│   │
│   │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   │  BFF LAYER — app/api/
│   │  (Yahi tumhara Backend for Frontend hai)
│   │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   │
│   ├── api/
│   │   │
│   │   ├── _core/                           ← BFF Core utilities (shared across all routes)
│   │   │   ├── auth.ts                      ← verifyJWT(), getSessionUser()
│   │   │   ├── redis.ts                     ← getCache(), setCache(), delCache()
│   │   │   ├── response.ts                  ← apiSuccess(), apiError() helpers
│   │   │   ├── middleware.ts                ← withAuth(), withRole(), withCache() wrappers
│   │   │   └── mongo.ts                     ← dbConnect() singleton
│   │   │
│   │   │━━━ AUTH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   │   ├── auth/
│   │   │   ├── login/route.ts               POST  → JWT set in httpOnly cookie
│   │   │   │                                       Redis: set refresh:{userId} TTL 7d
│   │   │   ├── signup/route.ts              POST  → Create user
│   │   │   ├── logout/route.ts              POST  → Clear cookie, del Redis keys
│   │   │   ├── me/route.ts                  GET   → Redis: user:me:{userId} TTL 5min
│   │   │   ├── refresh/route.ts             POST  → New access token from refresh token
│   │   │   ├── send-otp/route.ts            POST  → Redis: otp:{phone} TTL 5min
│   │   │   ├── verify-otp/route.ts          POST  → Check Redis OTP
│   │   │   ├── verify-otp-temp/route.ts     POST
│   │   │   ├── resend-otp/route.ts          POST
│   │   │   ├── forgot-password/route.ts     POST
│   │   │   ├── reset-password/route.ts      POST
│   │   │   ├── verify-reset-otp/route.ts    POST
│   │   │   ├── check-existing/route.ts      GET
│   │   │   ├── create-user/route.ts         POST
│   │   │   ├── select-brand/route.ts        POST  → del Redis: user:me:{userId}
│   │   │   └── verify-otp-temp/route.ts     POST
│   │   │
│   │   │━━━ ADMIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   │   ├── admin/
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── route.ts                 GET   → Redis: admin:users TTL 2min
│   │   │   │   │                            POST  → Create + del admin:users
│   │   │   │   ├── [userId]/route.ts        GET/PUT/DELETE + cache invalidate
│   │   │   │   ├── get/route.ts             GET   → Redis: admin:users TTL 2min
│   │   │   │   ├── approve/route.ts         POST  → del admin:users
│   │   │   │   ├── brands/route.ts          GET   → Redis: admin:brands TTL 5min
│   │   │   │   ├── managers/route.ts        GET   → Redis: admin:managers TTL 5min
│   │   │   │   ├── vendors/route.ts         GET   → Redis: admin:vendors TTL 5min
│   │   │   │   ├── assign-manager/route.ts  POST
│   │   │   │   ├── assigned-managers/
│   │   │   │   │   ├── route.ts             GET
│   │   │   │   │   └── [id]/route.ts        GET/DELETE
│   │   │   │   ├── search-brands/route.ts   GET
│   │   │   │   ├── search-managers/route.ts GET
│   │   │   │   ├── verify-cin/route.ts      POST
│   │   │   │   ├── verify-gst/route.ts      POST
│   │   │   │   └── verify-msme/route.ts     POST
│   │   │   │
│   │   │   ├── rates/
│   │   │   │   ├── get/route.ts             GET   → Redis: admin:rates TTL 10min
│   │   │   │   ├── post/route.ts            POST  → del admin:rates
│   │   │   │   ├── put/route.ts             PUT   → del admin:rates
│   │   │   │   ├── delete/route.ts          DELETE → del admin:rates
│   │   │   │   ├── approve-element/route.ts POST  → del admin:rates
│   │   │   │   ├── reject-element/route.ts  POST
│   │   │   │   ├── new-elements/route.ts    GET
│   │   │   │   ├── patch/route.ts           PATCH
│   │   │   │   └── upload-image/route.ts    POST
│   │   │   │
│   │   │   ├── role-permissions/
│   │   │   │   ├── get/route.ts             GET   → Redis: admin:roles:{brandId} TTL 15min
│   │   │   │   ├── post/route.ts            POST  → del admin:roles:{brandId}
│   │   │   │   ├── put/route.ts             PUT   → del admin:roles:{brandId}
│   │   │   │   └── delete/route.ts          DELETE → del admin:roles:{brandId}
│   │   │   │
│   │   │   ├── user-roles/
│   │   │   │   ├── get/route.ts             GET   → Redis: admin:userroles:{brandId} TTL 15min
│   │   │   │   ├── post/route.ts            POST  → del admin:userroles:{brandId}
│   │   │   │   ├── put/route.ts             PUT   → del admin:userroles:{brandId}
│   │   │   │   ├── delete/route.ts          DELETE
│   │   │   │   └── by-brand/route.ts        GET
│   │   │   │
│   │   │   └── myshare/
│   │   │       └── upload/route.ts          POST
│   │   │
│   │   │━━━ BRAND ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   │   ├── brand/
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── get/route.ts             GET   → Redis: brand:stores:{brandId} TTL 5min
│   │   │   │   ├── post/route.ts            POST  → del brand:stores:{brandId}
│   │   │   │   ├── put/route.ts             PUT   → del brand:stores:{brandId}
│   │   │   │   ├── delete/route.ts          DELETE → del brand:stores:{brandId}
│   │   │   │   ├── bulk/route.ts            POST  → del brand:stores:{brandId}
│   │   │   │   ├── check-duplicates/route.ts GET
│   │   │   │   ├── pincode/route.ts         GET
│   │   │   │   ├── pincode-lookup/route.ts  GET
│   │   │   │   ├── upload-image/route.ts    POST
│   │   │   │   ├── assign-manager/
│   │   │   │   │   ├── route.ts             POST
│   │   │   │   │   └── replace/route.ts     POST
│   │   │   │   └── unmapped/route.ts        GET   → (manager ke liye)
│   │   │   │
│   │   │   ├── sites/
│   │   │   │   └── get/route.ts             GET   → Redis: brand:sites:{brandId} TTL 5min
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── route.ts                 GET   → Redis: brand:orders:{brandId} TTL 1min
│   │   │   │   │                            POST  → Create order + del brand:orders:{brandId}
│   │   │   │   ├── verify-order/route.ts    POST  → del brand:orders:{brandId}
│   │   │   │   ├── review-creative/route.ts POST
│   │   │   │   ├── reject-site/route.ts     POST
│   │   │   │   ├── set-site-reference/route.ts POST
│   │   │   │   ├── accept-escalation/route.ts  POST
│   │   │   │   └── respond-escalation/route.ts POST
│   │   │   │
│   │   │   ├── cart/
│   │   │   │   ├── route.ts                 GET   → Redis: brand:cart:{userId} TTL 30min
│   │   │   │   │                            POST  → Update + set brand:cart:{userId}
│   │   │   │   └── clear/route.ts           POST  → del brand:cart:{userId}
│   │   │   │
│   │   │   ├── tenders/
│   │   │   │   ├── route.ts                 GET   → Redis: brand:tenders:{brandId} TTL 2min
│   │   │   │   ├── accept-bid/route.ts      POST  → del brand:tenders:{brandId}
│   │   │   │   └── generate-order/route.ts  POST
│   │   │   │
│   │   │   ├── racee/
│   │   │   │   ├── route.ts                 GET   → Redis: brand:racee:{brandId} TTL 2min
│   │   │   │   ├── post/route.ts            POST  → del brand:racee:{brandId}
│   │   │   │   ├── delete/route.ts          DELETE
│   │   │   │   ├── approve/route.ts         POST
│   │   │   │   ├── reject/route.ts          POST
│   │   │   │   ├── managers/route.ts        GET
│   │   │   │   ├── check-permission/route.ts GET
│   │   │   │   └── add-permission/route.ts  POST
│   │   │   │
│   │   │   ├── rates/
│   │   │   │   ├── get/route.ts             GET   → Redis: brand:rates:{brandId} TTL 10min
│   │   │   │   ├── post/route.ts            POST  → del brand:rates:{brandId}
│   │   │   │   ├── put/route.ts             PUT   → del brand:rates:{brandId}
│   │   │   │   ├── delete/route.ts          DELETE
│   │   │   │   └── search-master/route.ts   GET
│   │   │   │
│   │   │   ├── purchase-authority/
│   │   │   │   ├── get/route.ts             GET   → Redis: brand:purchase-auth:{brandId} TTL 15min
│   │   │   │   ├── post/route.ts            POST  → del brand:purchase-auth:{brandId}
│   │   │   │   ├── put/route.ts             PUT   → del brand:purchase-auth:{brandId}
│   │   │   │   └── delete/route.ts          DELETE
│   │   │   │
│   │   │   ├── store-authority/
│   │   │   │   ├── get/route.ts             GET   → Redis: brand:store-auth:{brandId} TTL 15min
│   │   │   │   ├── post/route.ts            POST  → del brand:store-auth:{brandId}
│   │   │   │   ├── put/route.ts             PUT   → del brand:store-auth:{brandId}
│   │   │   │   └── delete/route.ts          DELETE
│   │   │   │
│   │   │   ├── role-permissions/
│   │   │   │   ├── get/route.ts             GET   → Redis: brand:roles:{brandId} TTL 15min
│   │   │   │   ├── post/route.ts            POST  → del brand:roles:{brandId}
│   │   │   │   ├── put/route.ts             PUT   → del brand:roles:{brandId}
│   │   │   │   └── delete/route.ts          DELETE
│   │   │   │
│   │   │   ├── user-roles/
│   │   │   │   ├── get/route.ts             GET   → Redis: brand:userroles:{brandId} TTL 15min
│   │   │   │   ├── post/route.ts            POST  → del brand:userroles:{brandId}
│   │   │   │   ├── put/route.ts             PUT
│   │   │   │   └── delete/route.ts          DELETE
│   │   │   │
│   │   │   └── vendors/route.ts             GET   → Redis: brand:vendors:{brandId} TTL 5min
│   │   │
│   │   │━━━ MANAGER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   │   ├── manager/
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── route.ts                 GET   → Redis: mgr:stores:{managerId} TTL 5min
│   │   │   │   ├── post/route.ts            POST  → del mgr:stores:{managerId}
│   │   │   │   ├── put/route.ts             PUT   → del mgr:stores:{managerId}
│   │   │   │   ├── delete/route.ts          DELETE
│   │   │   │   ├── assign/route.ts          POST
│   │   │   │   ├── bulk/route.ts            POST
│   │   │   │   ├── check-duplicates/route.ts GET
│   │   │   │   ├── pincode-lookup/route.ts  GET
│   │   │   │   └── unmapped/route.ts        GET
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── route.ts                 GET   → Redis: mgr:orders:{managerId} TTL 1min
│   │   │   │   ├── final-submit/route.ts    POST  → del mgr:orders:{managerId}
│   │   │   │   └── upload-creative/route.ts POST
│   │   │   │
│   │   │   ├── racee/
│   │   │   │   ├── route.ts                 GET   → Redis: mgr:racee:{managerId} TTL 2min
│   │   │   │   ├── add-site/route.ts        POST  → del mgr:racee:{managerId}
│   │   │   │   ├── delete-site/route.ts     DELETE
│   │   │   │   ├── update-status/route.ts   PATCH
│   │   │   │   ├── update-store-location/route.ts PATCH
│   │   │   │   └── update-store-photo/route.ts    POST
│   │   │   │
│   │   │   ├── rates/
│   │   │   │   ├── route.ts                 GET   → Redis: mgr:rates:{managerId} TTL 10min
│   │   │   │   ├── get/route.ts             GET
│   │   │   │   ├── post/route.ts            POST  → del mgr:rates:{managerId}
│   │   │   │   ├── put/route.ts             PUT   → del mgr:rates:{managerId}
│   │   │   │   ├── delete/route.ts          DELETE
│   │   │   │   └── search-master/route.ts   GET
│   │   │   │
│   │   │   ├── teams/
│   │   │   │   ├── members/
│   │   │   │   │   ├── route.ts             GET   → Redis: mgr:team:{managerId} TTL 5min
│   │   │   │   │   │                        POST  → del mgr:team:{managerId}
│   │   │   │   │   ├── [id]/route.ts        GET/PUT/DELETE
│   │   │   │   │   ├── bulk/route.ts        POST
│   │   │   │   │   ├── bulk-by-manager/route.ts POST
│   │   │   │   │   └── check-duplicates/route.ts GET
│   │   │   │   └── authorities/route.ts     GET   → Redis: mgr:authorities:{managerId} TTL 15min
│   │   │   │
│   │   │   ├── role-permissions/route.ts    GET   → Redis: mgr:roles:{managerId} TTL 15min
│   │   │   │
│   │   │   └── switch-account/
│   │   │       ├── route.ts                 GET
│   │   │       └── brands/route.ts          GET
│   │   │
│   │   │━━━ VENDOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   │   ├── vendor/
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── route.ts                 GET   → Redis: vendor:orders:{vendorId} TTL 1min
│   │   │   │   ├── accept-order/route.ts    POST  → del vendor:orders:{vendorId}
│   │   │   │   ├── reject-order/route.ts    POST  → del vendor:orders:{vendorId}
│   │   │   │   ├── accept-escalation/route.ts  POST
│   │   │   │   ├── raise-escalation/route.ts   POST
│   │   │   │   ├── create-job-card/route.ts    POST
│   │   │   │   ├── create-installation-certificate/route.ts POST
│   │   │   │   ├── submit-installation-images/route.ts      POST
│   │   │   │   ├── final-submit-installation/route.ts       POST
│   │   │   │   ├── generate-ppt/route.ts    POST
│   │   │   │   ├── prepare-ppt-data/route.ts GET
│   │   │   │   ├── installcertificates/
│   │   │   │   │   └── [orderId]/route.ts   GET
│   │   │   │   └── openjobcards/
│   │   │   │       └── [orderId]/route.ts   GET
│   │   │   │
│   │   │   ├── tenders/
│   │   │   │   ├── route.ts                 GET   → Redis: vendor:tenders:{vendorId} TTL 2min
│   │   │   │   ├── submit-bid/route.ts      POST  → del vendor:tenders:{vendorId}
│   │   │   │   └── reject-bid/route.ts      POST
│   │   │   │
│   │   │   ├── rates/
│   │   │   │   ├── get/route.ts             GET   → Redis: vendor:rates:{vendorId} TTL 10min
│   │   │   │   ├── post/route.ts            POST  → del vendor:rates:{vendorId}
│   │   │   │   ├── put/route.ts             PUT   → del vendor:rates:{vendorId}
│   │   │   │   ├── delete/route.ts          DELETE
│   │   │   │   └── search-master/route.ts   GET
│   │   │   │
│   │   │   ├── openjobcards/
│   │   │   │   ├── update-order-status/route.ts  PATCH
│   │   │   │   └── update-site-status/route.ts   PATCH
│   │   │   │
│   │   │   ├── role-permissions/
│   │   │   │   ├── get/route.ts             GET   → Redis: vendor:roles:{vendorId} TTL 15min
│   │   │   │   ├── post/route.ts            POST  → del vendor:roles:{vendorId}
│   │   │   │   ├── put/route.ts             PUT
│   │   │   │   └── delete/route.ts          DELETE
│   │   │   │
│   │   │   └── user-roles/
│   │   │       ├── get/route.ts             GET   → Redis: vendor:userroles:{vendorId} TTL 15min
│   │   │       ├── post/route.ts            POST  → del vendor:userroles:{vendorId}
│   │   │       ├── put/route.ts             PUT
│   │   │       └── delete/route.ts          DELETE
│   │   │
│   │   │━━━ SHARED APIs ━━━━━━━━━━━━━━━━━━━━━━━━
│   │   ├── profile/
│   │   │   ├── get/route.ts                 GET   → Redis: profile:{userId} TTL 10min
│   │   │   ├── update-name/route.ts         POST  → del profile:{userId}
│   │   │   ├── change-password/route.ts     POST
│   │   │   ├── change-email/
│   │   │   │   ├── send-otp/route.ts        POST
│   │   │   │   └── verify-otp/route.ts      POST  → del profile:{userId}
│   │   │   └── change-phone/
│   │   │       ├── send-otp/route.ts        POST
│   │   │       └── verify-otp/route.ts      POST  → del profile:{userId}
│   │   │
│   │   ├── business/
│   │   │   ├── information/route.ts         GET/POST → Redis: biz:info:{userId} TTL 30min
│   │   │   └── kyc/route.ts                 GET/POST → Redis: biz:kyc:{userId} TTL 30min
│   │   │
│   │   ├── personal/
│   │   │   └── information/route.ts         GET/PUT
│   │   │
│   │   ├── teams/                           ← Shared (brand-level teams)
│   │   │   ├── members/
│   │   │   │   ├── route.ts                 GET/POST
│   │   │   │   ├── [id]/route.ts            GET/PUT/DELETE
│   │   │   │   ├── bulk/route.ts            POST
│   │   │   │   ├── bulk-by-manager/route.ts POST
│   │   │   │   └── check-duplicates/route.ts GET
│   │   │   ├── authorities/route.ts         GET
│   │   │   ├── manager-types/route.ts       GET
│   │   │   └── manager-details/
│   │   │       └── get/route.ts             GET
│   │   │
│   │   ├── installcertificates/
│   │   │   ├── [id]/route.ts                GET
│   │   │   ├── upload-images/route.ts       POST
│   │   │   └── update-site-images/route.ts  POST
│   │   │
│   │   ├── openjobcards/
│   │   │   └── [id]/route.ts                GET
│   │   │
│   │   ├── pptgen/
│   │   │   ├── fetch-data/route.ts          GET
│   │   │   └── delete-temp-data/route.ts    DELETE
│   │   │
│   │   └── home/page.tsx
│   │
│   │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   │  FRONTEND PAGES
│   │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   │
│   ├── (auth)/
│   │   ├── auth/
│   │   │   ├── login/page.tsx               ← Client Component
│   │   │   ├── signup/page.tsx              ← Client Component
│   │   │   ├── forgot-password/page.tsx     ← Client Component
│   │   │   └── verify-otp/page.tsx          ← Client Component
│   │   └── layout.tsx
│   │
│   ├── (defaults)/
│   │   ├── layout.tsx
│   │   └── page.tsx                         ← SSR | revalidate: 3600
│   │
│   ├── (user)/
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx                   ← SSR: sidebar config (Redis cached)
│   │   │   ├── page.tsx                     ← SSR: dashboard data | revalidate: 60
│   │   │   ├── users/
│   │   │   │   ├── page.tsx                 ← SSR: users list | revalidate: 30
│   │   │   │   ├── assign-managers/page.tsx ← Client
│   │   │   │   ├── brands/page.tsx          ← SSR | revalidate: 60
│   │   │   │   ├── managers/page.tsx        ← SSR | revalidate: 60
│   │   │   │   └── vendors/page.tsx         ← SSR | revalidate: 60
│   │   │   ├── rates/page.tsx               ← SSR | revalidate: 120
│   │   │   ├── role-permissions/page.tsx    ← SSR | revalidate: 900
│   │   │   ├── user-roles/page.tsx          ← SSR | revalidate: 900
│   │   │   ├── myshare/page.tsx             ← Client
│   │   │   └── teams/[managers]/page.tsx    ← SSR | revalidate: 60
│   │   │
│   │   ├── brand/
│   │   │   ├── layout.tsx                   ← SSR: auth check + sidebar
│   │   │   ├── page.tsx                     ← SSR: dashboard | revalidate: 60
│   │   │   ├── stores/page.tsx              ← SSR | revalidate: 60
│   │   │   ├── sites/page.tsx               ← SSR | revalidate: 60
│   │   │   ├── orders/page.tsx              ← SSR | revalidate: 30
│   │   │   ├── checkout/page.tsx            ← Client (cart interactive)
│   │   │   ├── tenders/page.tsx             ← SSR | revalidate: 60
│   │   │   ├── racee/page.tsx               ← SSR | revalidate: 60
│   │   │   ├── rates/page.tsx               ← SSR | revalidate: 120
│   │   │   ├── purchase-authority/page.tsx  ← SSR | revalidate: 900
│   │   │   ├── store-authority/page.tsx     ← SSR | revalidate: 900
│   │   │   ├── role-permissions/page.tsx    ← SSR | revalidate: 900
│   │   │   ├── user-roles/page.tsx          ← SSR | revalidate: 900
│   │   │   └── teams/[managers]/page.tsx    ← SSR | revalidate: 60
│   │   │
│   │   ├── manager/
│   │   │   ├── layout.tsx                   ← SSR: sidebar
│   │   │   ├── page.tsx                     ← SSR: dashboard | revalidate: 60
│   │   │   ├── [module]/page.tsx            ← SSR: dynamic module | revalidate: 60
│   │   │   └── team/[managers]/page.tsx     ← SSR | revalidate: 60
│   │   │
│   │   ├── vendor/
│   │   │   ├── layout.tsx                   ← SSR: sidebar
│   │   │   ├── page.tsx                     ← SSR: dashboard | revalidate: 60
│   │   │   ├── orders/page.tsx              ← SSR | revalidate: 30
│   │   │   ├── tenders/page.tsx             ← SSR | revalidate: 60
│   │   │   ├── rates/page.tsx               ← SSR | revalidate: 120
│   │   │   ├── role-permissions/page.tsx    ← SSR | revalidate: 900
│   │   │   ├── user-roles/page.tsx          ← SSR | revalidate: 900
│   │   │   └── teams/[managers]/page.tsx    ← SSR | revalidate: 60
│   │   │
│   │   ├── profile/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                     ← SSR | revalidate: 300
│   │   │
│   │   └── businessDetails/
│   │       └── page.tsx                     ← SSR | revalidate: 1800
│   │
│   ├── installation/[id]/page.tsx           ← SSR | dynamic (no revalidate)
│   ├── openjobcards/[id]/page.tsx           ← SSR | dynamic
│   ├── pptgen/[id]/page.tsx                 ← Client
│   ├── otp/page.tsx                         ← Client
│   ├── home/page.tsx                        ← SSR | revalidate: 3600
│   ├── globals.css
│   ├── globals.d.ts
│   └── layout.tsx                           ← SSR: root layout
│
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│  LIB — BFF Core + Helpers
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│
├── lib/
│   │
│   ├── api/                                 ← BFF Core (NEW — yahan sab shared logic)
│   │   ├── auth.ts                          ← verifyJWT(req), getServerUser(req)
│   │   ├── redis.ts                         ← getCache / setCache / delCache (Upstash)
│   │   ├── response.ts                      ← { success, data } / { success, error }
│   │   ├── mongo.ts                         ← dbConnect() singleton
│   │   └── middleware.ts                    ← withAuth, withRole, withCache wrappers
│   │
│   ├── auth/
│   │   ├── jwt.ts                           ← Keep (signJWT, verifyJWT helpers)
│   │   └── manager-auth.ts                  ← Keep
│   │
│   ├── context/
│   │   └── AuthContext.tsx                  ← Keep (client auth state)
│   │
│   ├── db/
│   │   ├── mongodb.ts                       ← Keep (dbConnect singleton)
│   │   ├── mongodb-client.ts                ← Keep
│   │   └── redis.ts                         ← Keep (Upstash Redis client)
│   │
│   ├── email/
│   │   ├── nodemailer.ts                    ← Keep
│   │   └── templates.ts                     ← Keep
│   │
│   ├── models/                              ← Keep all Mongoose models
│   │   ├── User.ts
│   │   ├── Order.ts
│   │   ├── Store.ts
│   │   ├── Site.ts
│   │   └── ... (sab models)
│   │
│   ├── redux/                               ← Keep as-is
│   │   ├── features/
│   │   │   ├── auth-slice.ts
│   │   │   └── cart-slice.ts
│   │   ├── hooks.ts
│   │   ├── store-provider.tsx
│   │   └── store.ts
│   │
│   ├── provider/
│   │   ├── MainDefaultProvider.tsx          ← Keep
│   │   └── RootProvider.tsx                 ← Keep
│   │
│   ├── sms/
│   │   └── fast2sms.ts                      ← Keep
│   │
│   ├── utils/
│   │   ├── api-retry.ts                     ← Keep
│   │   ├── create-default-roles.ts          ← Keep
│   │   ├── generateUniqueKey.ts             ← Keep
│   │   ├── location.ts                      ← Keep
│   │   ├── location-data.ts                 ← Keep
│   │   ├── otp.ts                           ← Keep
│   │   ├── priceCalculator.ts               ← Keep
│   │   ├── sidebar-cache.ts                 ← Keep (update to use lib/api/redis.ts)
│   │   └── uploadToBlob.ts                  ← Keep
│   │
│   ├── validations/
│   │   ├── auth.ts                          ← Keep
│   │   ├── business.ts                      ← Keep
│   │   └── password.ts                      ← Keep
│   │
│   ├── get-strict-context.tsx               ← Keep
│   ├── myshare.ts                           ← Keep
│   └── utils.ts                             ← Keep
│
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│  EXISTING — No Change
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│
├── components/                              ← Sab components as-is
├── hooks/                                   ← Sab SWR/client hooks as-is
├── modules/                                 ← As-is
├── types/                                   ← As-is
├── config/sidebar/                          ← As-is
├── public/                                  ← As-is
├── scripts/                                 ← As-is
├── docs/                                    ← As-is
│
├── middleware.ts                            ← JWT check → redirect if invalid
├── next.config.ts                           ← Keep
├── proxy.ts                                 ← Keep or remove
└── ...config files
```

---

## BFF Core Files — Code Pattern

### `lib/api/redis.ts`
```typescript
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key)
  } catch {
    return null
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number) {
  try {
    await redis.setex(key, ttlSeconds, value)
  } catch {}
}

export async function delCache(...keys: string[]) {
  try {
    await redis.del(...keys)
  } catch {}
}
```

### `lib/api/response.ts`
```typescript
import { NextResponse } from 'next/server'

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ success: false, message }, { status })
}
```

### `lib/api/auth.ts`
```typescript
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function getServerUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value
    || req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest) {
  const user = getServerUser(req)
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}
```

### `lib/api/middleware.ts`
```typescript
import { NextRequest } from 'next/server'
import { requireAuth } from './auth'
import { getCache, setCache } from './redis'
import { apiError } from './response'

type Handler = (req: NextRequest, user: any) => Promise<Response>

// Auth wrapper
export function withAuth(handler: Handler) {
  return async (req: NextRequest) => {
    try {
      const user = requireAuth(req)
      return await handler(req, user)
    } catch {
      return apiError('Unauthorized', 401)
    }
  }
}

// Auth + Role wrapper
export function withRole(roles: string[], handler: Handler) {
  return withAuth(async (req, user) => {
    if (!roles.includes(user.role)) {
      return apiError('Forbidden', 403)
    }
    return handler(req, user)
  })
}

// Cache wrapper (GET routes ke liye)
export function withCache(key: string, ttl: number, handler: Handler) {
  return withAuth(async (req, user) => {
    const cacheKey = key.replace('{userId}', user._id)
                        .replace('{brandId}', user.brandId)
                        .replace('{role}', user.role)

    const cached = await getCache(cacheKey)
    if (cached) return Response.json({ success: true, data: cached })

    const res = await handler(req, user)
    const json = await res.clone().json()

    if (json.success) await setCache(cacheKey, json.data, ttl)
    return res
  })
}
```

### Example Route — `app/api/brand/stores/get/route.ts`
```typescript
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/api/middleware'
import { apiSuccess, apiError } from '@/lib/api/response'
import { dbConnect } from '@/lib/db/mongodb'
import Store from '@/lib/models/Store'

export const GET = withCache('brand:stores:{brandId}', 300,
  async (req: NextRequest, user) => {
    await dbConnect()
    const stores = await Store.find({ brandId: user.brandId })
    return apiSuccess(stores)
  }
)
```

### Example SSR Page — `app/(user)/brand/stores/page.tsx`
```typescript
import { cookies } from 'next/headers'

async function getStores(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/brand/stores/get`, {
    headers: { Cookie: `token=${token}` },
    next: { revalidate: 60 }               // ISR — 60 sec
  })
  if (!res.ok) return []
  const json = await res.json()
  return json.data
}

export default async function BrandStoresPage() {
  const token = cookies().get('token')?.value || ''
  const stores = await getStores(token)   // SSR — server pe fetch

  return <StoresComponent initialData={stores} />
}
```

---

## Redis Cache Key Map

```
Auth:
  user:me:{userId}              TTL: 300s   (5 min)
  refresh:{userId}              TTL: 604800s (7 days)
  otp:{phone}                   TTL: 300s

Sidebar:
  sidebar:{userId}:{role}       TTL: 1800s  (30 min)

Admin:
  admin:users                   TTL: 120s
  admin:brands                  TTL: 300s
  admin:managers                TTL: 300s
  admin:vendors                 TTL: 300s
  admin:rates                   TTL: 600s
  admin:roles:{brandId}         TTL: 900s
  admin:userroles:{brandId}     TTL: 900s

Brand:
  brand:stores:{brandId}        TTL: 300s
  brand:sites:{brandId}         TTL: 300s
  brand:orders:{brandId}        TTL: 60s
  brand:tenders:{brandId}       TTL: 120s
  brand:racee:{brandId}         TTL: 120s
  brand:rates:{brandId}         TTL: 600s
  brand:cart:{userId}           TTL: 1800s
  brand:purchase-auth:{brandId} TTL: 900s
  brand:store-auth:{brandId}    TTL: 900s
  brand:roles:{brandId}         TTL: 900s
  brand:userroles:{brandId}     TTL: 900s

Manager:
  mgr:stores:{managerId}        TTL: 300s
  mgr:orders:{managerId}        TTL: 60s
  mgr:racee:{managerId}         TTL: 120s
  mgr:rates:{managerId}         TTL: 600s
  mgr:team:{managerId}          TTL: 300s
  mgr:authorities:{managerId}   TTL: 900s
  mgr:roles:{managerId}         TTL: 900s

Vendor:
  vendor:orders:{vendorId}      TTL: 60s
  vendor:tenders:{vendorId}     TTL: 120s
  vendor:rates:{vendorId}       TTL: 600s
  vendor:roles:{vendorId}       TTL: 900s
  vendor:userroles:{vendorId}   TTL: 900s

Profile:
  profile:{userId}              TTL: 600s
  biz:info:{userId}             TTL: 1800s
  biz:kyc:{userId}              TTL: 1800s
```

---

## Vercel + Services

```
Vercel (Single Deploy):
  ├── Next.js app → Vercel Edge/Serverless
  ├── API Routes  → Vercel Serverless Functions (auto)
  └── Static      → Vercel CDN

External Services (Free Tier available):
  ├── MongoDB Atlas     → MONGODB_URI env var
  ├── Upstash Redis     → UPSTASH_REDIS_REST_URL + TOKEN env vars
  ├── Vercel Blob       → BLOB_READ_WRITE_TOKEN (already used)
  └── Fast2SMS/Email    → API keys in env vars

Environment Variables (.env):
  MONGODB_URI=
  JWT_SECRET=
  JWT_REFRESH_SECRET=
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  FAST2SMS_API_KEY=
  NODEMAILER_USER=
  NODEMAILER_PASS=
  BLOB_READ_WRITE_TOKEN=
  NEXT_PUBLIC_APP_URL=
```

---

## SSR vs Client Decision Table

```
✅ SSR (Server Component)     → List pages, dashboards, detail pages
   fetch() inside page.tsx    → next: { revalidate: N }
   Cookie se token pass karo  → headers: { Cookie: `token=${token}` }

❌ Client Component            → Forms, modals, cart, interactive UI
   'use client'               → useSWR / TanStack Query hooks use karo
   hooks/ folder              → Already exist, bas API URL update karo
```

---

_Version: 2.0 | Single Next.js Project | Vercel Ready | Upstash Redis_
