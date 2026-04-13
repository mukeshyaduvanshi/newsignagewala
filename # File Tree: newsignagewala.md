# File Tree: newsignagewala

**Generated:** 4/13/2026, 11:37:44 AM
**Root Path:** `/home/mukeshyaduvanshi/Mukesh/newsignagewala`

```
├── 📁 app
│   ├── 📁 (auth)
│   │   ├── 📁 auth
│   │   │   ├── 📁 forgot-password
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 login
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 signup
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📁 verify-otp
│   │   │       └── 📄 page.tsx
│   │   └── 📄 layout.tsx
│   ├── 📁 (defaults)
│   │   ├── 📄 layout.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 (user)
│   │   ├── 📁 admin
│   │   │   ├── 📁 myshare
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 rates
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 role-permissions
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 teams
│   │   │   │   └── 📁 [managers]
│   │   │   │       └── 📄 page.tsx
│   │   │   ├── 📁 user-roles
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 users
│   │   │   │   ├── 📁 assign-managers
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 brands
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 managers
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 vendors
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 brand
│   │   │   ├── 📁 checkout
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 orders
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 purchase-authority
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 racee
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 rates
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 role-permissions
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 sites
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 store-authority
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 stores
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 teams
│   │   │   │   └── 📁 [managers]
│   │   │   │       └── 📄 page.tsx
│   │   │   ├── 📁 tenders
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 user-roles
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 businessDetails
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 manager
│   │   │   ├── 📁 [module]
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 team
│   │   │   │   └── 📁 [managers]
│   │   │   │       └── 📄 page.tsx
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 profile
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📄 page.tsx
│   │   └── 📁 vendor
│   │       ├── 📁 orders
│   │       │   └── 📄 page.tsx
│   │       ├── 📁 rates
│   │       │   └── 📄 page.tsx
│   │       ├── 📁 role-permissions
│   │       │   └── 📄 page.tsx
│   │       ├── 📁 teams
│   │       │   └── 📁 [managers]
│   │       │       └── 📄 page.tsx
│   │       ├── 📁 tenders
│   │       │   └── 📄 page.tsx
│   │       ├── 📁 user-roles
│   │       │   └── 📄 page.tsx
│   │       ├── 📄 layout.tsx
│   │       └── 📄 page.tsx
│   ├── 📁 api
│   │   ├── 📁 admin
│   │   │   ├── 📁 myshare
│   │   │   │   └── 📁 upload
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 rates
│   │   │   │   ├── 📁 approve-element
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 new-elements
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 patch
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 put
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 reject-element
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 upload-image
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 role-permissions
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 put
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 user-roles
│   │   │   │   ├── 📁 by-brand
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 put
│   │   │   │       └── 📄 route.ts
│   │   │   └── 📁 users
│   │   │       ├── 📁 [userId]
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 approve
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 assign-manager
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 assigned-managers
│   │   │       │   ├── 📁 [id]
│   │   │       │   │   └── 📄 route.ts
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 brands
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 get
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 managers
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 search-brands
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 search-managers
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 vendors
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 verify-cin
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 verify-gst
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 verify-msme
│   │   │       │   └── 📄 route.ts
│   │   │       └── 📄 route.ts
│   │   ├── 📁 auth
│   │   │   ├── 📁 check-existing
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 create-user
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 forgot-password
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 login
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 logout
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 me
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 refresh
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 resend-otp
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 reset-password
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 select-brand
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 send-otp
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 signup
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 verify-otp
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 verify-otp-temp
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 verify-reset-otp
│   │   │       └── 📄 route.ts
│   │   ├── 📁 brand
│   │   │   ├── 📁 cart
│   │   │   │   ├── 📁 clear
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 orders
│   │   │   │   ├── 📁 accept-escalation
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 reject-site
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 respond-escalation
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 review-creative
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 set-site-reference
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 verify-order
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 purchase-authority
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 put
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 racee
│   │   │   │   ├── 📁 add-permission
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 approve
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 check-permission
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 managers
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 reject
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 rates
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 put
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 search-master
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 role-permissions
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 put
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 sites
│   │   │   │   └── 📁 get
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 store-authority
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 put
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 stores
│   │   │   │   ├── 📁 assign-manager
│   │   │   │   │   ├── 📁 replace
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 bulk
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 check-duplicates
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 pincode
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 pincode-lookup
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 put
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 upload-image
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 tenders
│   │   │   │   ├── 📁 accept-bid
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 generate-order
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 user-roles
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 put
│   │   │   │       └── 📄 route.ts
│   │   │   └── 📁 vendors
│   │   │       └── 📄 route.ts
│   │   ├── 📁 business
│   │   │   ├── 📁 information
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 kyc
│   │   │       └── 📄 route.ts
│   │   ├── 📁 installcertificates
│   │   │   ├── 📁 [id]
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 update-site-images
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 upload-images
│   │   │       └── 📄 route.ts
│   │   ├── 📁 manager
│   │   │   ├── 📁 orders
│   │   │   │   ├── 📁 final-submit
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 upload-creative
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 racee
│   │   │   │   ├── 📁 add-site
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 delete-site
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 update-status
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 update-store-location
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 update-store-photo
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 rates
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 get
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 put
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 search-master
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 role-permissions
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 stores
│   │   │   │   ├── 📁 assign
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 bulk
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 check-duplicates
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 delete
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 pincode-lookup
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 post
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 put
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 unmapped
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 switch-account
│   │   │   │   ├── 📁 brands
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 teams
│   │   │       ├── 📁 authorities
│   │   │       │   └── 📄 route.ts
│   │   │       └── 📁 members
│   │   │           ├── 📁 [id]
│   │   │           │   └── 📄 route.ts
│   │   │           └── 📄 route.ts
│   │   ├── 📁 openjobcards
│   │   │   └── 📁 [id]
│   │   │       └── 📄 route.ts
│   │   ├── 📁 personal
│   │   │   └── 📁 information
│   │   │       └── 📄 route.ts
│   │   ├── 📁 pptgen
│   │   │   ├── 📁 delete-temp-data
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 fetch-data
│   │   │       └── 📄 route.ts
│   │   ├── 📁 profile
│   │   │   ├── 📁 change-email
│   │   │   │   ├── 📁 send-otp
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 verify-otp
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 change-password
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 change-phone
│   │   │   │   ├── 📁 send-otp
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 verify-otp
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 get
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 update-name
│   │   │       └── 📄 route.ts
│   │   ├── 📁 teams
│   │   │   ├── 📁 authorities
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📁 manager-details
│   │   │   │   └── 📁 get
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 manager-types
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 members
│   │   │       ├── 📁 [id]
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 bulk
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 bulk-by-manager
│   │   │       │   └── 📄 route.ts
│   │   │       ├── 📁 check-duplicates
│   │   │       │   └── 📄 route.ts
│   │   │       └── 📄 route.ts
│   │   └── 📁 vendor
│   │       ├── 📁 openjobcards
│   │       │   ├── 📁 update-order-status
│   │       │   │   └── 📄 route.ts
│   │       │   └── 📁 update-site-status
│   │       │       └── 📄 route.ts
│   │       ├── 📁 orders
│   │       │   ├── 📁 accept-escalation
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 accept-order
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 create-installation-certificate
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 create-job-card
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 final-submit-installation
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 generate-ppt
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 installcertificates
│   │       │   │   └── 📁 [orderId]
│   │       │   │       └── 📄 route.ts
│   │       │   ├── 📁 openjobcards
│   │       │   │   └── 📁 [orderId]
│   │       │   │       └── 📄 route.ts
│   │       │   ├── 📁 prepare-ppt-data
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 raise-escalation
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 reject-order
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 submit-installation-images
│   │       │   │   └── 📄 route.ts
│   │       │   └── 📄 route.ts
│   │       ├── 📁 rates
│   │       │   ├── 📁 delete
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 get
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 post
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 put
│   │       │   │   └── 📄 route.ts
│   │       │   └── 📁 search-master
│   │       │       └── 📄 route.ts
│   │       ├── 📁 role-permissions
│   │       │   ├── 📁 delete
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 get
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 post
│   │       │   │   └── 📄 route.ts
│   │       │   └── 📁 put
│   │       │       └── 📄 route.ts
│   │       ├── 📁 tenders
│   │       │   ├── 📁 reject-bid
│   │       │   │   └── 📄 route.ts
│   │       │   ├── 📁 submit-bid
│   │       │   │   └── 📄 route.ts
│   │       │   └── 📄 route.ts
│   │       └── 📁 user-roles
│   │           ├── 📁 delete
│   │           │   └── 📄 route.ts
│   │           ├── 📁 get
│   │           │   └── 📄 route.ts
│   │           ├── 📁 post
│   │           │   └── 📄 route.ts
│   │           └── 📁 put
│   │               └── 📄 route.ts
│   ├── 📁 home
│   │   └── 📄 page.tsx
│   ├── 📁 installation
│   │   └── 📁 [id]
│   │       └── 📄 page.tsx
│   ├── 📁 openjobcards
│   │   └── 📁 [id]
│   │       └── 📄 page.tsx
│   ├── 📁 otp
│   │   └── 📄 page.tsx
│   ├── 📁 pptgen
│   │   └── 📁 [id]
│   │       └── 📄 page.tsx
│   ├── 📄 favicon.ico
│   ├── 🎨 globals.css
│   ├── 📄 globals.d.ts
│   └── 📄 layout.tsx
├── 📁 components
│   ├── 📁 (user)
│   │   ├── 📁 admin
│   │   │   ├── 📁 rates
│   │   │   │   ├── 📄 components-master-rate-form.tsx
│   │   │   │   ├── 📄 components-master-rate-list.tsx
│   │   │   │   └── 📄 components-new-element-requests.tsx
│   │   │   ├── 📁 role-permissions
│   │   │   │   ├── 📄 components-role-permissions-form.tsx
│   │   │   │   └── 📄 components-role-permissions-list.tsx
│   │   │   ├── 📁 teams
│   │   │   │   ├── 📄 bulk-add-manager-modal.tsx
│   │   │   │   ├── 📄 components-manager.tsx
│   │   │   │   ├── 📄 components-view-details-Store.tsx
│   │   │   │   ├── 📄 search-input.tsx
│   │   │   │   └── 📄 store-list-component.tsx
│   │   │   ├── 📁 user-roles
│   │   │   │   ├── 📄 components-user-roles-form.tsx
│   │   │   │   └── 📄 components-user-roles-list.tsx
│   │   │   └── 📁 users
│   │   │       ├── 📄 assign-managers-form.tsx
│   │   │       ├── 📄 assigned-managers-list.tsx
│   │   │       ├── 📄 components-brands.tsx
│   │   │       ├── 📄 components-managers.tsx
│   │   │       ├── 📄 components-users.tsx
│   │   │       ├── 📄 components-vendors.tsx
│   │   │       ├── 📄 search-input.tsx
│   │   │       └── 📄 verification-modal.tsx
│   │   ├── 📁 brand
│   │   │   ├── 📁 cart
│   │   │   │   ├── 📄 cart-drawer.tsx
│   │   │   │   └── 📄 cart-sync.tsx
│   │   │   ├── 📁 checkout
│   │   │   │   ├── 📄 additional-notes.tsx
│   │   │   │   ├── 📄 order-information.tsx
│   │   │   │   ├── 📄 order-sites.tsx
│   │   │   │   ├── 📄 order-summary.tsx
│   │   │   │   ├── 📄 po-summary.tsx
│   │   │   │   ├── 📄 site-editor-table.tsx
│   │   │   │   └── 📄 vendor-selection-modal.tsx
│   │   │   ├── 📁 orders
│   │   │   │   ├── 📄 componets-orders.tsx
│   │   │   │   └── 📄 set-site-reference-image.tsx
│   │   │   ├── 📁 purchase-authority
│   │   │   │   ├── 📄 components-purchase-authority-form.tsx
│   │   │   │   └── 📄 components-purchase-authority-list.tsx
│   │   │   ├── 📁 racee
│   │   │   │   ├── 📄 components-brand-racee.tsx
│   │   │   │   ├── 📄 reject-reason-modal.tsx
│   │   │   │   └── 📄 view-sites-modal.tsx
│   │   │   ├── 📁 rates
│   │   │   │   ├── 📄 add-rate-modal.tsx
│   │   │   │   ├── 📄 components-rate.tsx
│   │   │   │   ├── 📄 edit-rate-modal.tsx
│   │   │   │   └── 📄 search-input.tsx
│   │   │   ├── 📁 role-permissions
│   │   │   │   ├── 📄 components-role-permissions-form.tsx
│   │   │   │   └── 📄 components-role-permissions-list.tsx
│   │   │   ├── 📁 sites
│   │   │   │   ├── 📄 components-all-sites.tsx
│   │   │   │   ├── 📄 site-card.tsx
│   │   │   │   ├── 📄 sites-grid.tsx
│   │   │   │   ├── 📄 sites-search.tsx
│   │   │   │   ├── 📄 store-sites-card.tsx
│   │   │   │   └── 📄 stores-search.tsx
│   │   │   ├── 📁 store-authority
│   │   │   │   ├── 📄 components-store-authority-form.tsx
│   │   │   │   └── 📄 components-store-authority-list.tsx
│   │   │   ├── 📁 stores
│   │   │   │   ├── 📄 add-store-modal.tsx
│   │   │   │   ├── 📄 assign-manager-modal.tsx
│   │   │   │   ├── 📄 bulk-add-store-modal.tsx
│   │   │   │   ├── 📄 components-all-store.tsx
│   │   │   │   ├── 📄 edit-store-modal.tsx
│   │   │   │   ├── 📄 replace-manager-modal.tsx
│   │   │   │   └── 📄 request-racee-modal.tsx
│   │   │   ├── 📁 teams
│   │   │   │   ├── 📄 bulk-add-manager-modal.tsx
│   │   │   │   ├── 📄 components-manager.tsx
│   │   │   │   ├── 📄 components-view-details-Store.tsx
│   │   │   │   ├── 📄 search-input.tsx
│   │   │   │   └── 📄 store-list-component.tsx
│   │   │   ├── 📁 tenders
│   │   │   │   └── 📄 components-tenders.tsx
│   │   │   ├── 📁 user-roles
│   │   │   │   ├── 📄 components-user-roles-form.tsx
│   │   │   │   └── 📄 components-user-roles-list.tsx
│   │   │   └── 📄 components-dashboard.tsx
│   │   ├── 📁 businessDetails
│   │   │   ├── 📄 businessInformation.tsx
│   │   │   └── 📄 businessKyc.tsx
│   │   ├── 📁 manager
│   │   │   └── 📄 components-dashboard.tsx
│   │   ├── 📁 vendor
│   │   │   ├── 📁 orders
│   │   │   │   ├── 📄 componets-orders.tsx
│   │   │   │   ├── 📄 installation-certificate-pdf.tsx
│   │   │   │   ├── 📄 job-card-pdf.tsx
│   │   │   │   └── 📄 review-installation-images.tsx
│   │   │   ├── 📁 rates
│   │   │   │   ├── 📄 add-rate-modal.tsx
│   │   │   │   ├── 📄 components-rate.tsx
│   │   │   │   ├── 📄 edit-rate-modal.tsx
│   │   │   │   └── 📄 search-input.tsx
│   │   │   ├── 📁 role-permissions
│   │   │   │   ├── 📄 components-role-permissions-form.tsx
│   │   │   │   └── 📄 components-role-permissions-list.tsx
│   │   │   ├── 📁 teams
│   │   │   │   ├── 📄 bulk-add-manager-modal.tsx
│   │   │   │   ├── 📄 components-manager.tsx
│   │   │   │   └── 📄 search-input.tsx
│   │   │   ├── 📁 tenders
│   │   │   │   └── 📄 components-tenders.tsx
│   │   │   ├── 📁 user-roles
│   │   │   │   ├── 📄 components-user-roles-form.tsx
│   │   │   │   └── 📄 components-user-roles-list.tsx
│   │   │   └── 📄 components-dashboard.tsx
│   │   └── 📄 unapproved-user.tsx
│   ├── 📁 animate-ui
│   │   └── 📁 primitives
│   │       ├── 📁 animate
│   │       │   └── 📄 slot.tsx
│   │       ├── 📁 buttons
│   │       │   ├── 📄 button.tsx
│   │       │   └── 📄 liquid.tsx
│   │       └── 📁 texts
│   │           └── 📄 sliding-number.tsx
│   ├── 📁 auth
│   │   ├── 📄 brand-selection-modal.tsx
│   │   ├── 📄 forgot-password-form.tsx
│   │   ├── 📄 login-form.tsx
│   │   ├── 📄 otp-form.tsx
│   │   ├── 📄 reset-password-modal.tsx
│   │   ├── 📄 signup-form.tsx
│   │   ├── 📄 verify-otp-form.tsx
│   │   └── 📄 verify-otp-modal.tsx
│   ├── 📁 installcertificates
│   │   ├── 📄 components-installation-certificate.tsx
│   │   ├── 📄 components-multiple-image-capture.tsx
│   │   └── 📄 user-info-modal.tsx
│   ├── 📁 layouts
│   │   ├── 📁 charts
│   │   │   ├── 📄 comonent-bar-chart-horizontal.tsx
│   │   │   ├── 📄 comonent-bar-chart-vertical.tsx
│   │   │   ├── 📄 component-multi-area-chart.tsx
│   │   │   ├── 📄 component-pie-chart.tsx
│   │   │   └── 📄 component-single-area-chart.tsx
│   │   ├── 📄 navbar.tsx
│   │   ├── 📄 sidebar.tsx
│   │   └── 📄 switch-account-modal.tsx
│   ├── 📁 maps
│   │   └── 📄 store-locations-map.tsx
│   ├── 📁 openjobcards
│   │   └── 📄 components-openjobcards.tsx
│   ├── 📁 pptgen
│   │   └── 📄 components-ppt-gen.tsx
│   ├── 📁 themes
│   │   ├── 📄 theme-provider.tsx
│   │   └── 📄 theme-toggle-button.tsx
│   └── 📁 ui
│       ├── 📁 modals
│       │   └── 📄 modalForm.tsx
│       ├── 📄 Loader.tsx
│       ├── 📄 avatar.tsx
│       ├── 📄 badge.tsx
│       ├── 📄 button.tsx
│       ├── 📄 calendar.tsx
│       ├── 📄 camera-view.tsx
│       ├── 📄 card.tsx
│       ├── 📄 chart.tsx
│       ├── 📄 checkbox.tsx
│       ├── 📄 collapsible.tsx
│       ├── 📄 company-switcher.tsx
│       ├── 📄 dialog.tsx
│       ├── 📄 dropdown-menu.tsx
│       ├── 📄 field.tsx
│       ├── 📄 form.tsx
│       ├── 📄 image-editor.tsx
│       ├── 📄 input-otp.tsx
│       ├── 📄 input.tsx
│       ├── 📄 item.tsx
│       ├── 📄 label.tsx
│       ├── 📄 location-filter.tsx
│       ├── 📄 navigation-menu.tsx
│       ├── 📄 network-indicator-client.tsx
│       ├── 📄 network-indicator.tsx
│       ├── 📄 page-loader.tsx
│       ├── 📄 photo-capture-flow.tsx
│       ├── 📄 popover.tsx
│       ├── 📄 progress.tsx
│       ├── 📄 radio-group.tsx
│       ├── 📄 scroll-area.tsx
│       ├── 📄 select.tsx
│       ├── 📄 separator.tsx
│       ├── 📄 sheet.tsx
│       ├── 📄 sidebar.tsx
│       ├── 📄 skeleton.tsx
│       ├── 📄 sonner.tsx
│       ├── 📄 table.tsx
│       ├── 📄 tabs.tsx
│       ├── 📄 textarea.tsx
│       └── 📄 tooltip.tsx
├── 📁 config
│   └── 📁 sidebar
│       ├── 📄 admin-sidebar.config.ts
│       ├── 📄 brand-sidebar.config.ts
│       ├── 📄 index.ts
│       ├── 📄 manager-sidebar.config.ts
│       └── 📄 vendor-sidebar.config.ts
├── 📁 docs
│   ├── 📝 BRAND_MANAGER_REALTIME.md
│   ├── 📝 BRAND_USER_GUIDE.md
│   ├── 📝 FORGOT_PASSWORD_FLOW.md
│   ├── 📝 GOOGLE_MAPS_INTEGRATION.md
│   ├── 📝 HTTPS_SETUP.md
│   ├── 📝 JWT_AUTHENTICATION_GUIDE.md
│   ├── 📝 MANAGER_BRAND_REALTIME_FIX.md
│   ├── 📝 MANAGER_DYNAMIC_MODULES.md
│   ├── 📝 PPT_GENERATION_CJAREKIPPTGEN_STYLE.md
│   ├── 📝 PPT_GENERATION_IMPLEMENTATION.md
│   ├── 📝 REDIS_SIDEBAR_CACHE.md
│   ├── 📝 SETUP_INSTRUCTIONS.md
│   ├── 📝 SMART_VERIFICATION_SYSTEM.md
│   ├── 📝 SSE_403_FORBIDDEN_ERROR.md
│   ├── 📝 SSE_IMPLEMENTATION_GUIDE.md
│   ├── 📝 SSE_IMPLEMENTATION_SUMMARY.md
│   ├── 📝 SSE_REALTIME_UPDATES.md
│   ├── 📝 SSE_REFACTOR.md
│   ├── 📝 SSE_REMOVAL.md
│   ├── 📝 SSE_STORM_FIX.md
│   ├── 📝 VENDOR_USER_GUIDE.md
│   └── 📝 VERCEL_BLOB_UPLOAD.md
├── 📁 hooks
│   ├── 📄 use-admin-stats.ts
│   ├── 📄 use-brand-stores.ts
│   ├── 📄 use-brands.ts
│   ├── 📄 use-installation-certificate.ts
│   ├── 📄 use-is-in-view.tsx
│   ├── 📄 use-manager-team-members.ts
│   ├── 📄 use-managers.ts
│   ├── 📄 use-mobile.ts
│   ├── 📄 use-openjobcard.ts
│   ├── 📄 use-order-install-certs.ts
│   ├── 📄 use-order-jobcards.ts
│   ├── 📄 use-profile-incomplete-toast.tsx
│   ├── 📄 use-store-sites.ts
│   ├── 📄 use-users.ts
│   ├── 📄 use-vendor-accept-escalation.ts
│   ├── 📄 use-vendor-escalation.ts
│   ├── 📄 use-vendor-order-actions.ts
│   ├── 📄 use-vendor-orders.ts
│   ├── 📄 use-vendor-tenders.ts
│   └── 📄 use-vendors.ts
├── 📁 lib
│   ├── 📁 auth
│   │   ├── 📄 jwt.ts
│   │   └── 📄 manager-auth.ts
│   ├── 📁 context
│   │   └── 📄 AuthContext.tsx
│   ├── 📁 db
│   │   ├── 📄 mongodb-client.ts
│   │   ├── 📄 mongodb.ts
│   │   └── 📄 redis.ts
│   ├── 📁 email
│   │   ├── 📄 nodemailer.ts
│   │   └── 📄 templates.ts
│   ├── 📁 hooks
│   │   ├── 📄 useAdminMasterRate.ts
│   │   ├── 📄 useAdminRolePermissions.ts
│   │   ├── 📄 useAdminUserRoles.ts
│   │   ├── 📄 useBrandManagerRates.ts
│   │   ├── 📄 useBrandRate.ts
│   │   ├── 📄 useBrandRates.ts
│   │   ├── 📄 useBrandRolePermissions.ts
│   │   ├── 📄 useBrandUserRoles.ts
│   │   ├── 📄 useBrandViewDetailsManagerStore.ts
│   │   ├── 📄 useManagerPermissions.ts
│   │   ├── 📄 useManagerRacees.ts
│   │   ├── 📄 useManagerRates.ts
│   │   ├── 📄 useManagerRolePermissions.ts
│   │   ├── 📄 useManagerStores.ts
│   │   ├── 📄 useManagerUserRoles.ts
│   │   ├── 📄 useManagerWorkAuthority.ts
│   │   ├── 📄 useNewElementRequests.ts
│   │   ├── 📄 usePurchaseAuthority.ts
│   │   ├── 📄 useStoreAuthority.ts
│   │   ├── 📄 useStores.ts
│   │   ├── 📄 useTeamMembers.ts
│   │   ├── 📄 useVendorRate.ts
│   │   ├── 📄 useVendorRolePermissions.ts
│   │   └── 📄 useVendorUserRoles.ts
│   ├── 📁 models
│   │   ├── 📄 BrandRate.ts
│   │   ├── 📄 BusinessDetails.ts
│   │   ├── 📄 BusinessKyc.ts
│   │   ├── 📄 Document.ts
│   │   ├── 📄 InstallationCertificate.ts
│   │   ├── 📄 MasterRate.ts
│   │   ├── 📄 OTP.ts
│   │   ├── 📄 OpenJobCards.ts
│   │   ├── 📄 Order.ts
│   │   ├── 📄 PurchaseAuthority.ts
│   │   ├── 📄 Racee.ts
│   │   ├── 📄 RolePermission.ts
│   │   ├── 📄 Site.ts
│   │   ├── 📄 Store.ts
│   │   ├── 📄 StoreAssignManager.ts
│   │   ├── 📄 StoreAuthority.ts
│   │   ├── 📄 TeamMember.ts
│   │   ├── 📄 Tender.ts
│   │   ├── 📄 User.ts
│   │   ├── 📄 UserRole.ts
│   │   ├── 📄 VendorRate.ts
│   │   └── 📄 cart.model.ts
│   ├── 📁 provider
│   │   ├── 📄 MainDefaultProvider.tsx
│   │   └── 📄 RootProvider.tsx
│   ├── 📁 redux
│   │   ├── 📁 features
│   │   │   ├── 📄 auth-slice.ts
│   │   │   └── 📄 cart-slice.ts
│   │   ├── 📄 hooks.ts
│   │   ├── 📄 store-provider.tsx
│   │   └── 📄 store.ts
│   ├── 📁 sms
│   │   └── 📄 fast2sms.ts
│   ├── 📁 utils
│   │   ├── 📄 api-retry.ts
│   │   ├── 📄 create-default-roles.ts
│   │   ├── 📄 generateUniqueKey.ts
│   │   ├── 📄 location-data.ts
│   │   ├── 📄 location.ts
│   │   ├── 📄 otp.ts
│   │   ├── 📄 priceCalculator.ts
│   │   ├── 📄 sidebar-cache.ts
│   │   └── 📄 uploadToBlob.ts
│   ├── 📁 validations
│   │   ├── 📄 auth.ts
│   │   ├── 📄 business.ts
│   │   └── 📄 password.ts
│   ├── 📄 get-strict-context.tsx
│   ├── 📄 myshare.ts
│   └── 📄 utils.ts
├── 📁 modules
│   ├── 📁 brands
│   │   ├── 📁 create-sites
│   │   │   └── 📄 components-manager-create-sites.tsx
│   │   ├── 📁 orders
│   │   │   └── 📄 components-manager-orders.tsx
│   │   ├── 📁 racee
│   │   │   └── 📄 components-manager-racee.tsx
│   │   ├── 📁 rates
│   │   │   ├── 📄 add-rate-modal.tsx
│   │   │   ├── 📄 components-manager-rate.tsx
│   │   │   ├── 📄 edit-rate-modal.tsx
│   │   │   └── 📄 search-input.tsx
│   │   ├── 📁 stores
│   │   │   ├── 📄 add-store-modal.tsx
│   │   │   ├── 📄 bulk-add-store-modal.tsx
│   │   │   ├── 📄 components-manager-stores.tsx
│   │   │   ├── 📄 edit-store-modal.tsx
│   │   │   └── 📄 unmapped-stores-modal.tsx
│   │   └── 📁 teams
│   │       └── 📄 components-manager-teams.tsx
│   └── 📁 create-sites
│       ├── 📄 location-capture.tsx
│       ├── 📄 start-racee-modal.tsx
│       ├── 📄 store-location-modal.tsx
│       ├── 📄 store-photo-modal.tsx
│       └── 📄 view-racee-modal.tsx
├── 📁 public
│   ├── 📁 avatars
│   │   └── 🖼️ user.png
│   ├── 📁 icons
│   │   ├── 📄 Citiesicon.js
│   │   ├── 📄 Closeicon.js
│   │   ├── 📄 Fabricatoricon.js
│   │   ├── 📄 Facebook.js
│   │   ├── 📄 Flogo.js
│   │   ├── 📄 Google.js
│   │   ├── 📄 Producticone.js
│   │   ├── 📄 Signagebk.tsx
│   │   ├── 📄 Signmenu.js
│   │   ├── 📄 SwLogoSml.tsx
│   │   └── 📄 Vendoricon.js
│   ├── 📁 images
│   │   ├── 🖼️ animation.gif
│   │   └── 🖼️ img.png
│   ├── 📁 samples
│   │   ├── 📄 bulk-managers-sample.csv
│   │   └── 📄 bulk-stores-sample.csv
│   ├── 📁 templetes
│   │   └── 📄 upload_team_data.xlsx
│   ├── 📄 Flogo.js
│   ├── 📄 Slogo.js
│   ├── 🖼️ audit.png
│   ├── 🖼️ blackboard.jpg
│   ├── 🖼️ colorswatch.png
│   ├── 📄 favicon.ico
│   ├── 🖼️ festivebranding.png
│   ├── 🖼️ fevicon.png
│   ├── 🖼️ file.svg
│   ├── 🖼️ globe.svg
│   ├── 🖼️ indiamapworkers.png
│   ├── 🖼️ library.png
│   ├── 🖼️ next copy.svg
│   ├── 🖼️ next.svg
│   ├── 🖼️ onlinetender.png
│   ├── 🖼️ realtime.png
│   ├── 🖼️ slogo.svg
│   ├── 🖼️ thirteen.svg
│   ├── 🖼️ vercel copy.svg
│   ├── 🖼️ vercel.svg
│   └── 🖼️ window.svg
├── 📁 scripts
│   ├── 📄 clear-redis-cache.js
│   ├── 📄 fix-admin-user.js
│   └── 📄 fix-teammember-index.js
├── 📁 types
│   ├── 📄 auth.types.ts
│   ├── 📄 brand-rate.types.ts
│   ├── 📄 database.types.ts
│   ├── 📄 email.types.ts
│   ├── 📄 fabric.d.ts
│   ├── 📄 index.ts
│   ├── 📄 master-rate.types.ts
│   ├── 📄 modal.types.ts
│   ├── 📄 order.types.ts
│   ├── 📄 purchase-authority.types.ts
│   ├── 📄 racee.types.ts
│   ├── 📄 role-permissions.types.ts
│   ├── 📄 sidebar.types.ts
│   ├── 📄 store-authority.types.ts
│   ├── 📄 store.types.ts
│   ├── 📄 team-member.types.ts
│   ├── 📄 upload.types.ts
│   ├── 📄 user-roles.types.ts
│   └── 📄 vendor-rate.types.ts
├── ⚙️ .gitignore
├── 📝 README.md
├── ⚙️ components.json
├── ⚙️ docker-compose.yml
├── 📄 eslint.config.mjs
├── 📄 next.config.ts
├── ⚙️ package.json
├── ⚙️ pnpm-lock.yaml
├── ⚙️ pnpm-workspace.yaml
├── 📄 postcss.config.mjs
├── 📄 proxy.ts
└── ⚙️ tsconfig.json
```

---

_Generated by FileTree Pro Extension_
