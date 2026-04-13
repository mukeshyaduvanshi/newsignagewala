# PPT Generation Feature - Complete Implementation Guide

## Overview
Implemented cjarekipptgen-style PPT generation for installation reports. User clicks "Generate PPT" button → Opens new tab with beautiful UI → User clicks "Download PPT" → PPT generates with all site details → Tab auto-closes after 5 seconds.

## Architecture Flow

```
User clicks "Generate PPT" button
        ↓
Frontend: Call prepare-ppt-data API
        ↓
Backend: 
  1. Fetch order by orderId
  2. Filter sites where status="submitted"
  3. Get unique storeIds
  4. Fetch store details (name, address, GPS location, photo)
  5. Group sites by store
  6. Format data similar to cjarekipptgen
  7. Save to temp MongoDB collection
  8. Return tempId
        ↓
Frontend: Open /pptgen/{tempId} in new tab
        ↓
New Tab (PPT Generation Page):
  1. Validate tempId via fetch-data API
  2. Show "Download PPT" button
  3. When clicked:
     - Fetch data from API
     - Process all images (get dimensions)
     - Generate PPT using PptxGenJS
     - Download PPT file
     - Delete temp data
     - Show "Download Complete" message
     - Auto-close tab after 5 seconds
```

## Implementation Details

### 1. API Routes Created

#### `app/api/vendor/orders/prepare-ppt-data/route.ts`
**Purpose:** Prepares PPT data from order and saves to temporary collection

**Request:**
```json
POST /api/vendor/orders/prepare-ppt-data
Authorization: Bearer {accessToken}
{
  "orderId": "69981725e00383d7361c5a50"
}
```

**Response:**
```json
{
  "success": true,
  "tempId": "507f1f77bcf86cd799439011",
  "message": "PPT data prepared successfully"
}
```

**Process:**
1. Verifies JWT token
2. Fetches order from MongoDB
3. Filters sites with `status === "submitted"`
4. Gets unique storeIds: `[...new Set(sites.map(site => site.storeId))]`
5. Fetches Store documents from database
6. Groups sites by storeId
7. Formats data:
```javascript
{
  storeName: store.storeName,
  storeAddress: store.storeAddress,
  storePhoto: store.storeImage,
  storeGPSLocation: {
    lat: store.storeLocation.coordinates[1],
    lng: store.storeLocation.coordinates[0]
  },
  sites: [
    {
      beforeImage: site.photo,
      afterImage: site.capturedImages[0],
      additionalAfterImages: site.capturedImages.slice(1),
      siteElemName: site.elementName,
      siteDesc: site.siteDescription,
      siteWidth: site.width,
      siteHeight: site.height,
      sitemUnit: site.measurementUnit,
      siteNumber: index + 1
    }
  ]
}
```
8. Saves to temp collection with 10-minute expiration
9. Returns tempId

#### `app/api/pptgen/fetch-data/route.ts`
**Purpose:** Fetches temporary PPT data

**Request:**
```
GET /api/pptgen/fetch-data?id={tempId}
```

**Response:**
```json
{
  "success": true,
  "data": [...formattedData],
  "orderNumber": "ORD-0226-2",
  "timestamp": "2026-02-20T10:00:00.000Z"
}
```

**Features:**
- Validates tempId exists
- Checks if data expired (> 10 minutes)
- Auto-deletes expired data
- Returns 404 if not found or expired

#### `app/api/pptgen/delete-temp-data/route.ts`
**Purpose:** Deletes temporary data after PPT download

**Request:**
```
DELETE /api/pptgen/delete-temp-data?id={tempId}
```

**Response:**
```json
{
  "success": true,
  "message": "Temp data deleted successfully",
  "id": "507f1f77bcf86cd799439011",
  "deletedCount": 1
}
```

### 2. Frontend Components

#### `components/pptgen/components-ppt-gen.tsx`
**Purpose:** PPT generation UI component (similar to cjarekipptgen)

**Features:**
- **Initial Loading:** Shows "Validating request..." spinner
- **Not Found Page:** If data doesn't exist or expired
- **Main UI:** Clean white background with centered button
- **Button States:**
  - `Loading Library...` - While PptxGenJS loads from CDN
  - `Download PPT` - Ready to generate
  - `Downloading...` - PPT generation in progress
  - `✅ Download Complete` - Success state

**PPT Generation Process:**
1. Fetches data from API
2. Gets image dimensions for all images (store photos, before/after images)
3. Creates PPT using PptxGenJS:
   ```javascript
   const pres = new window.PptxGenJS();
   ```

**PPT Layout (same as cjarekipptgen):**

- **Store Slide:**
  - GPS Location (Lat/Lng) at top
  - Store Name (large, bold, left)
  - Store Address (center, right side)
  - Store Photo (centered, large - 5x4 inches with aspect ratio)

- **Site Slides (for each site):**
  - Title: "Site {number} - {storeName}"
  - Element Name (right side, bold)
  - Dimensions: "{width} X {height} {unit}"
  - Site Description
  - Labels: "Before" and "After"
  - Before Image (left) - 4.5x4 inches with aspect ratio
  - After Image (right) - 4.5x4 inches with aspect ratio

- **Additional After Photos:**
  - Separate slides for each additional capturedImage
  - Title: "Site {number} - {storeName} (After Photo {n})"
  - Single large image centered - 7x4.5 inches

4. Downloads PPT with filename: `{orderNumber}_Installation_Report.pptx`
5. Deletes temp data from database
6. Shows countdown timer (5 seconds)
7. Auto-closes tab

**Loading Messages (rotate every 5 seconds):**
- "Preparing your presentation..."
- "Wait for the download to complete..."
- "Almost there..."

#### `app/pptgen/[id]/page.tsx`
**Purpose:** Dynamic route for PPT generation

```tsx
const page = async ({params}: Props) => {
   const { id } = await params;
   return <ComponentsPptGen id={id} />;
}
```

### 3. Layout Updates

#### `app/layout.tsx`
Added PptxGenJS CDN in `<head>`:
```tsx
<head>
  <script src="https://unpkg.com/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
</head>
```

### 4. Order Component Updates

#### Vendor Orders (`components/(user)/vendor/orders/componets-orders.tsx`)

**Changes:**
1. Import: `Presentation` icon
2. State: `isGeneratingPPT`
3. Handler updated:
```typescript
const handleGeneratePPT = async (order: VendorOrder) => {
  setIsGeneratingPPT(true);
  
  // Call prepare-ppt-data API
  const response = await fetch('/api/vendor/orders/prepare-ppt-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ orderId: order._id }),
  });
  
  const data = await response.json();
  
  // Open PPT generation page in new tab
  window.open(`/pptgen/${data.tempId}`, '_blank');
  
  setIsGeneratingPPT(false);
  toast.success('PPT generation page opened in new tab!');
};
```

4. Updated meta object:
```typescript
meta: {
  // ...existing
  generatePPT: handleGeneratePPT,
  generatingPPT: isGeneratingPPT
}
```

5. Button in dropdown:
```tsx
<DropdownMenuItem 
  className="flex gap-1" 
  onClick={() => meta?.generatePPT(order)}
  disabled={meta?.generatingPPT}
>
  <Presentation /> {meta?.generatingPPT ? 'Generating...' : 'Generate PPT'}
</DropdownMenuItem>
```

**Location:** Between "Install Certificate" and "Cancel Order"

#### Brand Orders (`components/(user)/brand/orders/componets-orders.tsx`)

**Changes:**
1. Import: `Presentation` icon
2. State: `isGeneratingPPT`
3. Handler: Same as vendor orders
4. Updated meta object: Same structure
5. Button added in **3 locations:**

   **Location 1:** Dropdown menu (orderStatus === "new")
   ```tsx
   <DropdownMenuItem 
     className="flex gap-1"
     onClick={() => meta?.generatePPT(order)}
     disabled={meta?.generatingPPT}
   >
     <Presentation /> {meta?.generatingPPT ? 'Generating...' : 'Generate PPT'}
   </DropdownMenuItem>
   ```
   
   **Location 2:** Dropdown menu (orderStatus !== "new")
   - Same button structure as Location 1
   
   **Location 3:** Order details view (button group)
   ```tsx
   <Button 
     variant={"outline"}
     onClick={() => handleGeneratePPT(selectedOrder)}
     disabled={isGeneratingPPT}
   >
     <Presentation /> {isGeneratingPPT ? 'Generating...' : 'Generate PPT'}
   </Button>
   ```

## Database Schema

### Temporary Collection Structure
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  orderNumber: "ORD-0226-2",
  data: [
    {
      storeName: "New Store 2",
      storeAddress: "123 Main St, City, State",
      storePhoto: "https://...",
      storeGPSLocation: {
        lat: "28.65712328803629",
        lng: "77.19332326501528"
      },
      sites: [
        {
          beforeImage: "https://...",
          afterImage: "https://...",
          additionalAfterImages: ["https://..."],
          siteElemName: "Flex Board Star Flex",
          siteDesc: "Store 2 Site 1",
          siteWidth: 120,
          siteHeight: 120,
          sitemUnit: "feet",
          siteNumber: 1
        }
      ]
    }
  ],
  createdAt: ISODate,
  expiresAt: ISODate  // 10 minutes from creation
}
```

**Collection Name:** `process.env.MONGODB_COLLECTION_NAME_SHARE_LINK` or `"temp_ppt_data"`

**TTL:** 10 minutes (600 seconds)

## Order Data Reference

Based on provided order data:
```json
{
  "_id": "69981725e00383d7361c5a50",
  "orderNumber": "ORD-0226-2",
  "sites": [
    {
      "siteId": "69981641e00383d7361c59a7",
      "storeId": "69981368e00383d7361c57e2",
      "storeName": "New Store 2",
      "storeLocation": {
        "type": "Point",
        "coordinates": [77.19332326501528, 28.65712328803629]
      },
      "elementName": "Flex Board Star Flex",
      "siteDescription": "Store 2 Site 1",
      "photo": "https://...store-photo.jpg",
      "capturedImages": [
        "https://...after-1.jpg",
        "https://...after-2.jpg"
      ],
      "width": 120,
      "height": 120,
      "measurementUnit": "feet",
      "status": "submitted"
    }
  ]
}
```

**Mapping:**
- `sites.storeLocation.coordinates[0]` → GPS Longitude
- `sites.storeLocation.coordinates[1]` → GPS Latitude
- Store details fetched from Store collection using `storeId`
- Before photo: `sites.photo`
- After photos: `sites.capturedImages[]`
- Only sites with `status === "submitted"` are included

## Key Differences from Old Implementation

| Aspect | Old (Direct PPT) | New (cjarekipptgen-style) |
|--------|------------------|---------------------------|
| **User Flow** | Click → Download immediately | Click → New tab → User clicks Download → Auto-close |
| **Data Storage** | Generated on-the-fly | Temporary collection with expiration |
| **Store Data** | Not fetched | Fetched GPS location and full address |
| **Multiple After Images** | Single slide | Separate slides for each additional image |
| **PPT Layout** | Basic | Professional: GPS coords, store info, proper spacing |
| **Library Loading** | Client-side bundle | CDN script in layout |
| **Memory Cleanup** | Basic URL revocation | Full temp data deletion + URL revocation |
| **User Experience** | Auto-download only | Loading messages + countdown + auto-close |

## Testing Checklist

### ✅ Backend Testing:
- [ ] API `/api/vendor/orders/prepare-ppt-data` returns tempId
- [ ] Temp data saved to MongoDB collection
- [ ] Store details fetched correctly by storeId
- [ ] GPS coordinates mapped correctly (lng/lat)
- [ ] Only submitted sites included in data
- [ ] Data expires after 10 minutes
- [ ] `/api/pptgen/fetch-data` returns correct data
- [ ] `/api/pptgen/delete-temp-data` removes data

### ✅ Frontend Testing:
- [ ] Vendor orders: Generate PPT button visible
- [ ] Brand orders: Generate PPT button in all 3 locations
- [ ] Click button → New tab opens
- [ ] Loading state shows "Preparing PPT data..."
- [ ] Success toast: "PPT generation page opened in new tab!"
- [ ] New tab shows "Download PPT" button
- [ ] Button disabled while library loading
- [ ] Click Download → PPT generates
- [ ] PPT includes:
  - [ ] Store slides with GPS coordinates
  - [ ] Store name and address
  - [ ] Store photo (if available)
  - [ ] Site slides with before/after comparison
  - [ ] Additional after photos on separate slides
  - [ ] Site dimensions and element names
- [ ] PPT filename: `{orderNumber}_Installation_Report.pptx`
- [ ] Success message + countdown timer
- [ ] Tab closes after 5 seconds
- [ ] Temp data deleted from database

### ✅ Error Handling:
- [ ] No submitted sites → Error toast
- [ ] Invalid tempId → Not found page
- [ ] Expired tempId → Not found page
- [ ] Missing JWT token → 401 error
- [ ] Image load failure → Gracefully skipped
- [ ] PptxGenJS not loaded → Button disabled

## File Structure

```
app/
├── api/
│   ├── pptgen/
│   │   ├── fetch-data/
│   │   │   └── route.ts          ✅ NEW - Fetch temp PPT data
│   │   └── delete-temp-data/
│   │       └── route.ts          ✅ NEW - Delete temp data
│   └── vendor/
│       └── orders/
│           ├── generate-ppt/
│           │   └── route.ts      ⚠️  OLD - Can be removed
│           └── prepare-ppt-data/
│               └── route.ts      ✅ NEW - Prepare and save data
├── layout.tsx                    ✅ MODIFIED - Added PptxGenJS CDN
└── pptgen/
    └── [id]/
        └── page.tsx              ✅ NEW - Dynamic PPT generation page

components/
├── pptgen/
│   └── components-ppt-gen.tsx    ✅ NEW - PPT generation UI
└── (user)/
    ├── vendor/
    │   └── orders/
    │       └── componets-orders.tsx  ✅ MODIFIED - Added PPT button
    └── brand/
        └── orders/
            └── componets-orders.tsx  ✅ MODIFIED - Added PPT button (3 locations)

lib/
└── db/
    └── mongodb-client.ts         ✅ NEW - MongoDB native client for temp collections
```

## Environment Variables Required

```env
MONGODB_URI=mongodb://...
MONGODB_DB_NAME=signagewala
MONGODB_COLLECTION_NAME_SHARE_LINK=temp_ppt_data
```

## Build Output

```bash
✓ Compiled successfully in 30.5s
✓ Finished TypeScript in 29.5s
✓ Collecting page data using 11 workers in 5.2s
✓ Generating static pages using 11 workers (184/184) in 6.2s
✓ Finalizing page optimization in 77.5ms

New Routes:
├ ƒ /api/pptgen/delete-temp-data
├ ƒ /api/pptgen/fetch-data
├ ƒ /api/vendor/orders/prepare-ppt-data
└ ƒ /pptgen/[id]
```

## Summary of Changes

**Total Files Created:** 5
- `app/api/vendor/orders/prepare-ppt-data/route.ts`
- `app/api/pptgen/fetch-data/route.ts`
- `app/api/pptgen/delete-temp-data/route.ts`
- `app/pptgen/[id]/page.tsx`
- `components/pptgen/components-ppt-gen.tsx`

**Total Files Modified:** 3
- `app/layout.tsx` - Added PptxGenJS CDN script
- `components/(user)/vendor/orders/componets-orders.tsx` - Updated PPT generation logic
- `components/(user)/brand/orders/componets-orders.tsx` - Added PPT button in 3 locations

**Total MongoDB Collections:** 1
- `temp_ppt_data` (or from env var) - Stores temporary PPT data with 10-minute TTL

## Next Steps for Production

1. **Add TTL Index to MongoDB:**
```javascript
db.temp_ppt_data.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
```

2. **Environment Variables:**
- Set `MONGODB_COLLECTION_NAME_SHARE_LINK` in production `.env`

3. **Monitoring:**
- Track temp collection size
- Monitor API response times
- Log PPT generation failures

4. **Optional Enhancements:**
- Add brand logo to PPT
- Customize PPT theme colors
- Add installer details slides
- Email PPT instead of download
- Save PPT history for re-download

## Conclusion

Implementation complete! Users can now generate professional installation reports with:
- ✅ Beautiful UI matching cjarekipptgen
- ✅ Store GPS locations and addresses
- ✅ Before/After photo comparisons
- ✅ Multiple after photos on separate slides
- ✅ Professional PPT layout
- ✅ Auto-cleanup (temp data + tab closing)
- ✅ Works from both vendor and brand order pages
- ✅ All builds pass successfully

Samjhe? 🎉
