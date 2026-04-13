# 🏭 Signagewala - Vendor User Guide

Welcome to **Signagewala** - Your Gateway to Signage Business Opportunities!

This guide will help you navigate the platform as a Vendor, from initial setup to executing orders and growing your business.

---

## 📑 Table of Contents

1. [Getting Started](#getting-started)
2. [Account Setup](#account-setup)
3. [Initial Configuration](#initial-configuration)
4. [Managing Orders](#managing-orders)
5. [Bidding on Tenders](#bidding-on-tenders)
6. [Price Escalation](#price-escalation)
7. [Work Execution](#work-execution)
8. [Documentation](#documentation)
9. [Managing Your Team](#managing-your-team)
10. [FAQs](#faqs)

---

## 🚀 Getting Started

### Step 1: Create Your Account

1. Visit the Signagewala homepage
2. Click on **"Sign Up"**
3. Fill in your details:
   - **Name**: Your full name
   - **Email**: Business email address
   - **Phone**: 10-digit mobile number
   - **Password**: Must contain at least 8 characters, one uppercase letter, and one special character
4. Select **"Vendor"** as your user type
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

| Field         | Description               | Example                           |
| ------------- | ------------------------- | --------------------------------- |
| Company Name  | Legal business name       | "XYZ Signage Solutions Pvt Ltd"   |
| GST Number    | 15-digit GSTIN            | "29XYZAB1234C1Z5"                 |
| Business Type | Type of signage services  | Manufacturing, Installation, etc. |
| Address       | Registered office address | "456 Industrial Area"             |
| State         | Business state            | "Maharashtra"                     |
| City          | Business city             | "Mumbai"                          |
| Pincode       | 6-digit pincode           | "400001"                          |
| Company Logo  | Upload your logo          | PNG/JPG (max 500KB)               |

### Business KYC

Upload the following documents for verification:

- ✅ **PAN Card** - Company PAN card
- ✅ **GST Certificate** - GST registration certificate
- ✅ **Business License** - Trade license or registration
- ✅ **Other Documents** - Portfolio, certifications (optional)

> ⏳ **Note**: After submitting KYC, your account will be reviewed by our admin team. You'll be notified once approved (usually within 24-48 hours).

---

## ⚙️ Initial Configuration

Once approved, set up your business configuration to start receiving orders.

### 1. Team Authority (`/vendor/team-authority`)

Organize your workforce into teams for better management.

**What is Team Authority?**

- Creates organizational divisions (Installation Crew, Maintenance Team, etc.)
- Helps assign work to specific teams
- Enables delegation to team managers

**How to Create:**

1. Go to **Authority** → **Team Authority**
2. Click **"Add Team Authority"**
3. Enter:
   - **Label Name**: Display name (e.g., "Installation Team A")
   - **Unique Key**: System identifier (e.g., "installTeamA")
4. Click **Save**

**Example Structure:**

```
├── Installation Team North
├── Installation Team South
├── Maintenance Crew
└── Emergency Response Team
```

### 2. Work Authority (`/vendor/work-authority`)

Define the types of signage work your company offers.

**How to Create:**

1. Go to **Authority** → **Work Authority**
2. Click **"Add Work Authority"**
3. Define work types you offer:
   - New Installation
   - Repair & Maintenance
   - Removal & Disposal
   - Modification/Upgrade
   - Emergency Services

### 3. Rate Configuration (`/vendor/rates`)

Set up your pricing for different signage elements. This is crucial for tender bidding!

**How to Add Rates:**

1. Go to **Rates** → **Rate**
2. Click **"Add Rate"**
3. Configure:

| Field        | Description                                  |
| ------------ | -------------------------------------------- |
| Element Type | Type of signage (Glow Sign, Flex, LED, etc.) |
| Your Rate    | Your price per unit                          |
| Unit         | sq.ft, running ft, per piece                 |
| Calculation  | How to calculate total                       |

**Example Rate Card:**
| Element | Your Rate | Unit | Notes |
|---------|-----------|------|-------|
| Glow Sign Board | ₹180 | per sq.ft | Including installation |
| Flex Banner | ₹55 | per sq.ft | Print + installation |
| Vinyl Sticker | ₹80 | per sq.ft | Application included |
| Neon Sign | ₹550 | per running ft | Custom fabrication |
| LED Board | ₹350 | per sq.ft | With power connection |
| ACP Cladding | ₹250 | per sq.ft | Material + labor |

> 💡 **Pro Tip**: Keep your rates competitive but realistic. These rates auto-populate when you bid on tenders.

---

## 📦 Managing Orders

Orders are work assigned to you directly by Brands. Here's how to manage them effectively.

### Viewing Orders (`/vendor/orders`)

1. Go to **Orders** → **Order**
2. View all orders with details:
   - Order Number
   - Brand Name
   - Number of Sites
   - Total Amount
   - Status
   - Deadline

### Order Filters

Filter orders by status:

- **New** - Recently received, awaiting your response
- **Accepted** - You've accepted, ready to start
- **In-Progress** - Work underway
- **Completed** - Finished orders
- **Rejected** - Orders you declined
- **Escalation** - Price change pending

### Responding to New Orders

When you receive a new order:

#### View Order Details

Click on the order to see:

- **Sites List**: All signage elements to be installed
- **Dimensions**: Width × Height for each site
- **Photos**: Reference images of locations
- **Creative Links**: Design files to use
- **Instructions**: Special requirements per site
- **Store Locations**: GPS coordinates and addresses
- **Deadline**: When work must be completed

#### Accept Order

If you can fulfill the order:

1. Click **"Accept Order"**
2. Confirm your acceptance
3. Status changes to **"Accepted"**
4. You can now proceed with execution

#### Reject Order

If you cannot fulfill the order:

1. Click **"Reject Order"**
2. Provide a reason (optional but recommended)
3. Order returns to the Brand
4. They can assign to another vendor

### Order Actions Menu

| Action                 | When to Use                    |
| ---------------------- | ------------------------------ |
| 👁️ View Details        | See complete order information |
| ✅ Accept              | Agree to fulfill the order     |
| ❌ Reject              | Decline the order              |
| 📈 Raise Escalation    | Request price adjustment       |
| 📋 Job Card            | Print work checklist           |
| 🖨️ Install Certificate | Generate completion proof      |
| 🗺️ View on Map         | See store locations            |

---

## 📋 Bidding on Tenders

Tenders are opportunities where multiple vendors can bid. Win tenders to grow your business!

### Viewing Tenders (`/vendor/tenders`)

1. Go to **Tenders** → **All Tenders**
2. Browse available tenders from various Brands
3. Filter by status:
   - **Pending** - Not yet bid on
   - **Submitted** - Your bid is submitted
   - **Rejected** - You declined to bid

### Tender Information

Each tender shows:
| Field | Description |
|-------|-------------|
| Tender Number | Unique identifier |
| Brand | Company posting the tender |
| Total Sites | Number of signage elements |
| Estimated Value | Brand's budget estimate |
| Deadline | Last date to submit bid |
| Your Bid Status | Pending/Submitted/Rejected |

### How to Submit a Bid

1. **Click on a Tender** to view details

2. **Review Sites**:
   - Each site shows element type, dimensions, location
   - Brand's estimated rate is shown
   - Enter YOUR rate for each site

3. **Enter Custom Rates**:

   ```
   ┌─────────────┬──────────────┬──────────────┐
   │ Element     │ Brand Rate   │ Your Rate    │
   ├─────────────┼──────────────┼──────────────┤
   │ Glow Sign   │ ₹150/sq.ft   │ [₹180]       │
   │ Flex Banner │ ₹50/sq.ft    │ [₹55]        │
   │ LED Board   │ ₹300/sq.ft   │ [₹350]       │
   └─────────────┴──────────────┴──────────────┘
   ```

4. **Add Vendor Charges** (if applicable):
   - Transportation
   - Lifting/Crane charges
   - Permission fees
   - Any other charges

5. **Review Total Bid Amount**

6. **Click "Submit Bid"**

### Bid Outcomes

After submitting:

| Outcome             | What Happens                            |
| ------------------- | --------------------------------------- |
| ✅ **Awarded**      | You won! Order is created automatically |
| ❌ **Not Selected** | Another vendor was chosen               |
| ⏳ **Pending**      | Brand is still reviewing bids           |

### Tips for Winning Tenders

1. **Competitive Pricing**: Balance profitability with competitiveness
2. **Quick Response**: Early bids show eagerness
3. **Complete Profile**: Brands prefer vendors with full documentation
4. **Quality History**: Good completion records improve chances
5. **Realistic Charges**: Don't overload with additional charges

---

## 📈 Price Escalation

Sometimes actual work conditions differ from estimates. Use escalation to request price adjustments.

### When to Raise Escalation

- Site conditions different from photos
- Additional work discovered on-site
- Material costs increased
- Special equipment needed
- Access difficulties requiring extra effort

### How to Raise Escalation

1. Go to the order in **Orders** → **Order**
2. Click **"Raise Escalation"** from actions menu
3. Fill in the escalation form:

#### Site-wise Changes

```
┌─────────────┬──────────────┬──────────────┬──────────────────┐
│ Site        │ Old Rate     │ New Rate     │ Reason           │
├─────────────┼──────────────┼──────────────┼──────────────────┤
│ Glow Sign   │ ₹150/sq.ft   │ ₹180/sq.ft   │ Higher wall work │
│ Flex Banner │ ₹50/sq.ft    │ ₹65/sq.ft    │ Special printing │
└─────────────┴──────────────┴──────────────┴──────────────────┘
```

#### Additional Charges

```
┌────────────────────┬───────────────┐
│ Charge Type        │ Amount        │
├────────────────────┼───────────────┤
│ Crane Rental       │ ₹5,000        │
│ Permission Fees    │ ₹2,000        │
│ Night Work Premium │ ₹3,000        │
└────────────────────┴───────────────┘
```

4. **Add Reason**: Explain why escalation is needed
5. **Click "Submit Escalation"**

### Escalation Status

| Status       | Meaning                                            |
| ------------ | -------------------------------------------------- |
| **Pending**  | Waiting for Brand's response                       |
| **Approved** | Brand accepted new pricing                         |
| **Rejected** | Brand declined, negotiate or proceed with original |

### After Escalation Decision

- **If Approved**: Continue work with new pricing
- **If Rejected**:
  - Contact Brand to negotiate
  - Proceed with original pricing
  - Or discuss order cancellation

---

## 🔧 Work Execution

Follow this workflow for successful order completion.

### Step 1: Print Job Card

Before starting work:

1. Go to order details
2. Click **"Job Card"** or **"Print"**
3. Job Card contains:
   - Order details (number, dates, brand)
   - Complete site list with dimensions
   - Creative links for each site
   - Special instructions
   - Store addresses and contacts

4. **Print the Job Card** for your field team

### Step 2: Mark In-Progress

When you start work:

1. Update order status to **"In-Progress"**
2. Brand receives notification
3. Begin on-site installation

### Step 3: On-Site Installation

**Field Work Checklist:**

- [ ] Navigate to store using GPS location
- [ ] Verify site measurements
- [ ] Review creative/design files
- [ ] Check special instructions
- [ ] Perform installation work
- [ ] Take "before" photos (if needed)
- [ ] Take "after" photos (required)
- [ ] Get store manager sign-off (if required)
- [ ] Move to next site

### Step 4: Upload Completion Photos

For each site:

1. Take clear photos of installed signage
2. Include wide shot showing context
3. Include close-up showing quality
4. Upload to the order

### Step 5: Generate Installation Certificate

1. Go to order details
2. Click **"Installation Certificate"**
3. Review all sites marked complete
4. Ensure photos are uploaded
5. Generate PDF certificate
6. Certificate serves as proof of completion

### Step 6: Mark Completed

1. Click **"Mark Completed"**
2. Status changes to **"Completed"**
3. Brand receives notification
4. Order is ready for invoicing

---

## 📄 Documentation

### Job Card

**Purpose**: Field reference document for installation team

**Contains**:

- Order number and dates
- Brand information
- Complete site list
- Dimensions for each site
- Creative/design links
- Special instructions
- Store addresses

**How to Access**:

1. Order details → Actions → Job Card
2. Click "Print" to generate PDF

### Installation Certificate

**Purpose**: Proof of work completion

**Contains**:

- Order summary
- Vendor details
- Completion date
- Site-by-site status
- Completion photos
- Total work value

**How to Generate**:

1. Order details → Actions → Installation Certificate
2. Ensure all sites are marked complete
3. Verify photos are uploaded
4. Generate and download PDF

### Using Documents for Invoicing

After order completion:

1. Download Installation Certificate
2. Attach to your invoice
3. Submit to Brand for payment
4. Keep copies for records

---

## 👥 Managing Your Team

### Creating Team Structure

Organize your workforce:

1. **Team Authority**: Create team divisions
   - Installation Teams
   - Maintenance Crews
   - Regional Teams

2. **Work Authority**: Define capabilities
   - What types of work each team handles
   - Specializations

### Assigning Work

1. When you accept an order, assign to appropriate team
2. Share Job Card with team lead
3. Track progress through order status
4. Update status as work progresses

### Team Best Practices

- Keep teams updated on job card details
- Ensure teams have access to creative files
- Communicate special instructions clearly
- Set clear deadlines for each site
- Regular check-ins during multi-day jobs

---

## 📊 Dashboard Overview

Your vendor dashboard shows:

| Widget                 | Information                        |
| ---------------------- | ---------------------------------- |
| **Order Stats**        | New, In-Progress, Completed counts |
| **Revenue**            | Monthly earnings overview          |
| **Pending Actions**    | Orders needing response            |
| **Upcoming Deadlines** | Orders due soon                    |
| **Recent Activity**    | Latest order updates               |

---

## ❓ FAQs

### Account & Setup

**Q: How long does account approval take?**

> Usually 24-48 hours. You'll receive an email notification once approved.

**Q: Can I update my rates later?**

> Yes, go to Rates and edit anytime. Changes apply to future bids only.

**Q: What if my KYC documents are rejected?**

> You'll receive feedback on why. Upload corrected documents and resubmit.

### Orders

**Q: Can I partially accept an order?**

> No, orders must be fully accepted or rejected. Discuss partial work with the Brand.

**Q: What if I can't meet the deadline?**

> Contact the Brand immediately. They may extend or reassign the order.

**Q: How do I know if an order is profitable?**

> Review all sites, calculate your costs, and compare with the order total before accepting.

### Tenders

**Q: Can I modify my bid after submission?**

> No, bids are final once submitted. Review carefully before submitting.

**Q: How are tenders awarded?**

> Brands review all bids and select based on pricing, vendor profile, and past performance.

**Q: What happens if I win a tender?**

> An order is automatically created. Treat it like any other order.

### Escalation

**Q: How often can I raise escalation?**

> Escalation should be raised once after site assessment. Multiple escalations are discouraged.

**Q: What if Brand rejects my escalation?**

> Negotiate directly with the Brand or proceed with original pricing.

**Q: Can I cancel an order after escalation rejection?**

> Discuss with the Brand. Cancellation should be mutual to maintain good relations.

### Payments

**Q: How are payments handled?**

> Payments are managed outside the platform. Use Installation Certificate for invoicing.

**Q: When should I invoice?**

> After order status is "Completed" and Installation Certificate is generated.

---

## 🆘 Need Help?

### Support Channels

- **Email**: vendor-support@signagewala.com
- **Phone**: +91-XXXXX-XXXXX
- **In-App**: Click "Help" in the sidebar

### Reporting Issues

1. Go to Profile → Help & Support
2. Describe your issue
3. Attach screenshots if relevant
4. Submit ticket

---

## 📱 Quick Reference

### Order Status Colors

| Status      | Color     | Meaning                |
| ----------- | --------- | ---------------------- |
| New         | 🟡 Yellow | Awaiting your response |
| Accepted    | 🔵 Teal   | Ready to start         |
| In-Progress | 🟣 Purple | Work ongoing           |
| Completed   | 🟢 Green  | Successfully finished  |
| Rejected    | 🔴 Red    | You declined           |
| Escalation  | 🟠 Orange | Price change pending   |
| Cancelled   | 🔴 Red    | Order cancelled        |

### Key Actions Checklist

**For New Orders:**

- [ ] Review order details thoroughly
- [ ] Check site locations on map
- [ ] Verify you can meet deadline
- [ ] Calculate profitability
- [ ] Accept or Reject promptly

**For Accepted Orders:**

- [ ] Print Job Card
- [ ] Assign to team
- [ ] Mark In-Progress when starting
- [ ] Complete all sites
- [ ] Upload photos
- [ ] Generate Installation Certificate
- [ ] Mark Completed

---

## 🎯 Best Practices for Success

1. **Respond Quickly**: Fast responses to orders and tenders improve your reputation
2. **Accurate Pricing**: Set realistic rates that cover costs and profit
3. **Quality Work**: Good work leads to repeat business
4. **Clear Communication**: Update status promptly, communicate delays early
5. **Complete Documentation**: Always upload completion photos
6. **Maintain Profile**: Keep business info and KYC current
7. **Build Relationships**: Good Brand relationships = more direct orders
8. **Track Performance**: Monitor your completion rate and ratings

---

## 📋 Checklist for New Vendors

### Setup Phase

- [ ] Create account and verify email/phone
- [ ] Complete business information
- [ ] Upload KYC documents
- [ ] Wait for admin approval
- [ ] Set up Team Authority
- [ ] Set up Work Authority
- [ ] Configure your rate card

### First Order

- [ ] Receive first order notification
- [ ] Review order details carefully
- [ ] Accept the order
- [ ] Print Job Card
- [ ] Execute the work
- [ ] Upload completion photos
- [ ] Generate Installation Certificate
- [ ] Mark as Completed
- [ ] Submit invoice to Brand

### Growing Your Business

- [ ] Bid on relevant tenders
- [ ] Maintain competitive pricing
- [ ] Deliver quality work on time
- [ ] Build positive Brand relationships
- [ ] Expand team as workload grows

---

**Happy Business Growth! 🚀**

_Last Updated: February 2026_
_Version: 1.2.1_
