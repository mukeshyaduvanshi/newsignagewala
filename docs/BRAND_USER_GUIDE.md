# 🏢 Signagewala - Brand User Guide

Welcome to **Signagewala** - Your Next Generation Digital Signage Management Platform!

This guide will help you navigate the platform as a Brand user, from initial setup to managing orders effectively.

---

## 📑 Table of Contents

1. [Getting Started](#getting-started)
2. [Account Setup](#account-setup)
3. [Initial Configuration](#initial-configuration)
4. [Managing Stores](#managing-stores)
5. [Managing Sites (RACEE)](#managing-sites-racee)
6. [Rate Management](#rate-management)
7. [Creating Orders](#creating-orders)
8. [Creating Tenders](#creating-tenders)
9. [Order Tracking](#order-tracking)
10. [Managing Your Team](#managing-your-team)
11. [FAQs](#faqs)

---

## 🚀 Getting Started.

### Step 1: Create Your Account

1. Visit the Signagewala homepage
2. Click on **"Sign Up"**
3. Fill in your details:
   - **Name**: Your full name
   - **Email**: Business email address
   - **Phone**: 10-digit mobile number
   - **Password**: Must contain at least 8 characters, one uppercase letter, and one special character
4. Select **"Brand"** as your user type
5. Click **"Create Account"**

### Step 2: Verify Your Identity

You'll need to verify both your email and phone number:

#### Email Verification

- Check your inbox for a 6-digit OTP
- Enter the OTP within 10 minutes
- Click "Verify"

#### Phone Verification

- You'll receive an SMS with a 6-digit OTP
- Enter the OTP within 10 minutes
- Click "Verify"

> 💡 **Tip**: If you don't receive the OTP, click "Resend OTP" after 60 seconds.

---

## 🏗️ Account Setup

After verification, you'll need to complete your business profile before accessing the dashboard.

### Business Information

Fill in your company details:

| Field         | Description               | Example                     |
| ------------- | ------------------------- | --------------------------- |
| Company Name  | Legal business name       | "ABC Retail Pvt Ltd"        |
| GST Number    | 15-digit GSTIN            | "29ABCDE1234F1Z5"           |
| Business Type | Type of business          | Retail, Manufacturing, etc. |
| Address       | Registered office address | "123 MG Road"               |
| State         | Business state            | "Karnataka"                 |
| City          | Business city             | "Bangalore"                 |
| Pincode       | 6-digit pincode           | "560001"                    |
| Company Logo  | Upload your logo          | PNG/JPG (max 500KB)         |

### Business KYC

Upload the following documents for verification:

- ✅ **PAN Card** - Company PAN card
- ✅ **GST Certificate** - GST registration certificate
- ✅ **Other Documents** - Any additional business documents (optional)

> ⏳ **Note**: After submitting KYC, your account will be reviewed by our admin team. You'll be notified once approved (usually within 24-48 hours).

---

## ⚙️ Initial Configuration

Once approved, set up your organizational structure before creating stores and orders.

### 1. Team Authority (`/brand/team-authority`)

Define your team hierarchy for better organization.

**What is Team Authority?**

- Creates organizational divisions (Zones, Regions, Areas)
- Helps categorize stores under different teams
- Enables delegation to team managers

**How to Create:**

1. Go to **Authority** → **Team Authority**
2. Click **"Add Team Authority"**
3. Enter:
   - **Label Name**: Display name (e.g., "North Zone")
   - **Unique Key**: System identifier (e.g., "northZone")
4. Click **Save**

**Example Structure:**

```
├── North Zone
├── South Zone
├── East Zone
└── West Zone
```

### 2. Store Authority (`/brand/store-authority`)

Define store categories/formats.

**How to Create:**

1. Go to **Authority** → **Store Authority**
2. Click **"Add Store Authority"**
3. Define store formats:
   - Premium Store
   - Regular Store
   - Franchise
   - Kiosk

### 3. Work Authority (`/brand/work-authority`)

Define types of work for signage.

**Common Work Types:**

- Installation (New signage)
- Maintenance (Repairs)
- Removal (Taking down signage)
- Modification (Changes to existing)

### 4. Purchase Authority (`/brand/purchase-authority`)

Set up Purchase Order (PO) templates.

**Configuration:**

- PO Number format
- Approval limits
- Default terms

---

## 🏪 Managing Stores

### Adding a Single Store

1. Go to **Stores** → **All Store**
2. Click **"Add Store"**
3. Fill in store details:

| Field        | Description                            |
| ------------ | -------------------------------------- |
| Store Name   | Unique store identifier                |
| Address      | Complete store address                 |
| State        | Store location state                   |
| City         | Store city                             |
| Pincode      | Store pincode                          |
| Team         | Assign to a team (from Team Authority) |
| Store Format | Category (from Store Authority)        |
| GPS Location | Latitude & Longitude (for maps)        |

4. Click **Save**

### Bulk Upload Stores (CSV)

For adding multiple stores at once:

1. Click **"Bulk Add"**
2. Download the CSV template
3. Fill in store data following the template format
4. Upload the completed CSV
5. Review and confirm the import

**CSV Template Columns:**

```csv
storeName,address,state,city,pincode,team,storeFormat,latitude,longitude
Store Mumbai 1,123 Main St,Maharashtra,Mumbai,400001,westZone,Premium,19.0760,72.8777
Store Delhi 1,456 Market Rd,Delhi,New Delhi,110001,northZone,Regular,28.6139,77.2090
```

### Viewing Store Details

Click on any store to view:

- Store information
- Associated sites
- Order history
- Location on map

---

## 📍 Managing Sites (RACEE)

Sites are the actual signage elements at each store. The RACEE process helps you survey and document each site.

### What is RACEE?

| Letter | Meaning   | Description                 |
| ------ | --------- | --------------------------- |
| **R**  | Recce     | Site survey and measurement |
| **A**  | Artwork   | Design requirements         |
| **C**  | Creative  | Creative design approval    |
| **E**  | Estimate  | Cost estimation             |
| **E**  | Execution | Installation work           |

### Adding a Site

1. Go to a specific store or **Sites** → **All Sites**
2. Click **"Start RACEE"** or **"Add Site"**
3. Fill in site details:

| Field            | Description           | Example               |
| ---------------- | --------------------- | --------------------- |
| Element Name     | Type of signage       | "Glow Sign Board"     |
| Description      | Additional details    | "Main entrance board" |
| Width            | Signage width         | 10                    |
| Height           | Signage height        | 4                     |
| Measurement Unit | Unit of measurement   | sq.ft / running ft    |
| Photo            | Current site photo    | Upload image          |
| Rate             | Select from rate card | ₹150/sq.ft            |

4. Click **Save**

### Site Photo Requirements

- Clear, well-lit photo of the location
- Show the exact area where signage will be installed
- Include reference points for size estimation
- Maximum file size: 500KB (auto-compressed)

---

## 💰 Rate Management

Set up your pricing structure for different signage elements.

### Adding Rates (`/brand/rates`)

1. Go to **Rates** → **Rate**
2. Click **"Add Rate"**
3. Select from Master Rate elements or create custom
4. Configure:

| Field        | Description                  |
| ------------ | ---------------------------- |
| Element Type | Type of signage              |
| Rate         | Price per unit               |
| Unit         | sq.ft, running ft, per piece |
| Calculation  | How to calculate total       |

**Example Rate Card:**
| Element | Rate | Unit |
|---------|------|------|
| Glow Sign Board | ₹150 | per sq.ft |
| Flex Banner | ₹50 | per sq.ft |
| Vinyl Sticker | ₹75 | per sq.ft |
| Neon Sign | ₹500 | per running ft |
| LED Board | ₹300 | per sq.ft |

---

## 🛒 Creating Orders

### Adding Sites to Cart

1. Browse stores or sites
2. Click **"Add to Cart"** on desired sites
3. Adjust quantities if needed
4. View cart by clicking the cart icon

### Checkout Process

1. Click **"Checkout"** from cart
2. Fill in **Order Information**:
   - Order Date
   - Deadline Date
   - PO Number (select from Purchase Authority)
   - Order Type: **Order** or **Tender**

3. Review **Order Sites**:
   - Verify quantities and dimensions
   - Add creative links (design files)
   - Add special instructions per site

4. Add **Additional Charges** (if any):
   - Transportation
   - Lifting charges
   - Permissions
   - Any custom charges

5. Review **Order Summary**:
   - Subtotal
   - Additional charges
   - Tax
   - **Total Amount**

6. Select Order Type:

#### For Direct Order:

- Click **"Place Order"**
- Select a vendor from approved vendor list
- Confirm order

#### For Tender:

- Click **"Create Tender"**
- Order is published for vendor bidding
- Review bids and select winner

### Order Number Format

Orders are automatically numbered: `ORD-MMYY-SL`

- Example: `ORD-0226-42` (Order #42 in February 2026)

---

## 📋 Creating Tenders

Tenders allow multiple vendors to bid on your work.

### Creating a Tender

1. During checkout, select **"Tender"** as order type
2. Fill in tender details:
   - Tender number
   - Submission deadline
   - Requirements

3. Click **"Create Tender"**

### Managing Tender Responses

1. Go to **Tenders** → **All Tenders**
2. View submitted bids
3. Compare vendor quotes
4. Award tender to selected vendor

---

## 📊 Order Tracking

### Order Status Flow

```
NEW → CONFIRMED → IN-PROGRESS → COMPLETED
         ↓              ↓
      REJECTED      ESCALATION
                        ↓
                   CANCELLED
```

| Status          | Meaning                                 |
| --------------- | --------------------------------------- |
| **New**         | Order created, awaiting vendor response |
| **Confirmed**   | Vendor accepted the order               |
| **In-Progress** | Work has started                        |
| **Completed**   | Work finished, certificates uploaded    |
| **Rejected**    | Vendor declined the order               |
| **Escalation**  | Price change requested                  |
| **Cancelled**   | Order cancelled                         |

### Viewing Orders (`/brand/orders`)

1. Go to **Orders** → **Order**
2. View all orders with filters:
   - By status
   - By date range
   - By vendor
   - By store

### Handling Escalations

If a vendor requests a price change:

1. You'll receive a notification
2. Go to the order details
3. Review the escalation:
   - Old price vs New price
   - Reason for escalation
   - Site-wise changes

4. Take action:
   - **Approve**: Accept new pricing
   - **Reject**: Decline and negotiate

### Order Documents

Each order generates:

| Document                     | When           | Purpose                         |
| ---------------------------- | -------------- | ------------------------------- |
| **Open Job Card**            | Work starts    | Vendor fills work details       |
| **Installation Certificate** | Work completes | Proof of completion with photos |

---

## 👥 Managing Your Team

### Creating Managers

Delegate work to managers for specific tasks.

1. Go to relevant team page
2. Click **"Add Manager"**
3. Fill in manager details:
   - Name
   - Email
   - Phone
   - Manager Type (based on Work Authority)

4. Manager receives login credentials

### Manager Permissions

Managers can only access features based on their assigned:

- **Work Authority**: What type of work they handle
- **Team Assignment**: Which stores they manage
- **Purchase Limits**: Order value limits

### Manager Types

| Type          | Permissions                        |
| ------------- | ---------------------------------- |
| Store Manager | Manage assigned stores, view sites |
| Site Manager  | Conduct RACEE surveys, add sites   |
| Order Manager | Create and track orders            |
| Zone Manager  | Full access to assigned zone/team  |

---

## ❓ FAQs

### Account & Setup

**Q: How long does account approval take?**

> Usually 24-48 hours. You'll receive an email notification once approved.

**Q: Can I update my business information later?**

> Yes, go to Profile settings to update details. Some changes may require re-verification.

**Q: What if my KYC documents are rejected?**

> You'll receive feedback on why. Upload corrected documents and resubmit.

### Stores & Sites

**Q: Can I delete a store?**

> Stores with active orders cannot be deleted. Archive them instead.

**Q: How do I update site measurements?**

> Edit the site and update dimensions. This won't affect existing orders.

**Q: What photo formats are supported?**

> JPEG, PNG, and WebP. Maximum 5MB (auto-compressed to 500KB).

### Orders

**Q: Can I cancel an order after placing?**

> Orders can be cancelled only if status is "New". Contact vendor for other statuses.

**Q: How do I track order progress?**

> Go to Orders → click on specific order → view timeline and updates.

**Q: What if vendor doesn't respond?**

> You can cancel and reassign to another vendor after 48 hours.

### Payments

**Q: How are payments handled?**

> Payments are managed outside the platform. Orders show totals for invoicing.

---

## 🆘 Need Help?

### Support Channels

- **Email**: support@signagewala.com
- **Phone**: +91-XXXXX-XXXXX
- **In-App**: Click "Help" in the sidebar

### Reporting Issues

1. Go to Profile → Help & Support
2. Describe your issue
3. Attach screenshots if relevant
4. Submit ticket

---

## 📱 Quick Reference

### Keyboard Shortcuts

| Shortcut   | Action       |
| ---------- | ------------ |
| `Ctrl + K` | Quick search |
| `Ctrl + N` | New order    |
| `Esc`      | Close modal  |

### Dashboard Widgets

Your dashboard shows:

- 📊 Order statistics
- 📈 Monthly trends
- 🔔 Recent notifications
- ⚡ Quick actions

---

## 🎯 Best Practices

1. **Complete Setup First**: Configure all authorities before adding stores
2. **Accurate Measurements**: Ensure site dimensions are precise for accurate quotes
3. **Clear Photos**: Upload well-lit, clear site photos
4. **Detailed Instructions**: Provide specific instructions for each site
5. **Regular Updates**: Keep store and site information current
6. **Review Rates**: Periodically review and update your rate card

---

## 📋 Checklist for New Brands

- [ ] Create account and verify email/phone
- [ ] Complete business information
- [ ] Upload KYC documents
- [ ] Wait for admin approval
- [ ] Set up Team Authority
- [ ] Set up Store Authority
- [ ] Set up Work Authority
- [ ] Set up Purchase Authority
- [ ] Add your first store
- [ ] Configure rate card
- [ ] Conduct first RACEE survey
- [ ] Create your first order

---

**Happy Signaging! 🎉**

_Last Updated: February 2026_
_Version: 1.2.1_
