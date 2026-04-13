# Google Maps Integration for Store Locations

## Overview
Vendor orders ke saath store locations ko Google Maps par visualize karne ke liye ek complete mapping solution implement kiya gaya hai.

## Features Implemented

### 1. **Store Locations Map Component** 
File: `components/maps/store-locations-map.tsx`

**Key Features:**
- ✅ Multiple store locations ko ek hi map par show karta hai
- ✅ Har location par numbered marker with custom label
- ✅ Info window on marker click (store name, element, coordinates)
- ✅ Auto-fit bounds to show all markers
- ✅ Loading state with spinner
- ✅ Error handling with helpful messages
- ✅ "Open in Google Maps" button for external navigation
- ✅ Location list with numbering

**Component Props:**
```typescript
interface StoreLocationsMapProps {
  locations: StoreLocation[];  // Array of locations to show
  open: boolean;               // Dialog open state
  onOpenChange: (open: boolean) => void;  // Dialog state handler
}

interface StoreLocation {
  storeName: string;           // Store ka naam
  coordinates: number[];       // [longitude, latitude]
  elementName?: string;        // Site element (Flex Stand, etc.)
}
```

### 2. **Vendor Orders Integration**
File: `components/(user)/vendor/orders/componets-orders.tsx`

**Changes Made:**
- ✅ StoreLocationsMap component import kiya
- ✅ `mapOpen` state variable added
- ✅ `handleViewMap()` function - Map dialog ko open karta hai
- ✅ `getStoreLocations()` function - Order sites se unique locations extract karta hai
- ✅ Teeno View Map buttons ko onClick handler diya
- ✅ Map component ko render kiya with proper props

**Map Opening Logic:**
```typescript
const handleViewMap = () => {
  if (!selectedOrder) return;
  setMapOpen(true);
};
```

**Location Extraction Logic:**
```typescript
const getStoreLocations = () => {
  const locationsMap = new Map();
  
  selectedOrder.sites.forEach(site => {
    if (site.storeLocation?.coordinates) {
      const key = `${site.storeLocation.coordinates[0]}-${site.storeLocation.coordinates[1]}`;
      if (!locationsMap.has(key)) {
        locationsMap.set(key, {
          storeName: site.storeName,
          coordinates: site.storeLocation.coordinates,
          elementName: site.elementName,
        });
      }
    }
  });
  
  return Array.from(locationsMap.values());
};
```

### 3. **TypeScript Interface Updates**
File: `hooks/use-vendor-orders.ts`

**OrderSite Interface:**
```typescript
export interface OrderSite {
  // ... existing fields
  storeLocation?: {
    type: string;
    coordinates: number[];  // [longitude, latitude]
  };
}
```

### 4. **Google Maps API Setup**

**Environment Variable:**
File: `.env.local`
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
```

**Dependencies Added:**
```json
{
  "devDependencies": {
    "@types/google.maps": "^3.58.1"
  }
}
```

**Script Loading:**
Map component mein dynamically Google Maps script load hota hai:
```typescript
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
```

## How It Works

### 1. **User Flow:**
```
User clicks "View Map" button
    ↓
handleViewMap() executes
    ↓
setMapOpen(true)
    ↓
StoreLocationsMap component renders
    ↓
getStoreLocations() extracts unique locations
    ↓
Google Maps script loads
    ↓
Map initializes with markers
    ↓
User can:
  - Click markers to see info
  - Use map controls (zoom, street view)
  - Click "Open in Google Maps" for external navigation
```

### 2. **Location Extraction Logic:**
- Order ke har site se `storeLocation.coordinates` extract hota hai
- Duplicate locations ko filter kar diya jata hai (same coordinates = same location)
- Map ke liye unique locations ka array create hota hai

### 3. **Map Initialization:**
```
1. Calculate center (average of all coordinates)
2. Create Google Map instance
3. Add numbered markers for each location
4. Create info windows with store details
5. Fit bounds to show all markers
6. Add click listeners to markers
```

### 4. **External Google Maps:**
"Open in Google Maps" button:
- Single location: Direct link `?q=lat,lng`
- Multiple locations: Directions link with all waypoints

## Usage Instructions

### 1. **Google Maps API Key Setup:**

**Step 1:** Google Cloud Console pe jao:
```
https://console.cloud.google.com/
```

**Step 2:** Enable APIs:
- Maps JavaScript API
- Geocoding API (optional)

**Step 3:** Create API Key:
```
Navigation Menu → APIs & Services → Credentials → Create Credentials → API Key
```

**Step 4:** Restrict API Key (Security):
```
HTTP referrers: localhost:3000, your-domain.com
API restrictions: Maps JavaScript API
```

**Step 5:** Add to .env.local:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_API_KEY_HERE"
```

### 2. **Using the Component:**

```tsx
import { StoreLocationsMap } from "@/components/maps/store-locations-map";

// In your component:
const [mapOpen, setMapOpen] = useState(false);

const locations = [
  {
    storeName: "Store 1",
    coordinates: [77.5946, 12.9716], // [lng, lat]
    elementName: "Flex Stand"
  },
  // ... more locations
];

// Render:
<StoreLocationsMap
  locations={locations}
  open={mapOpen}
  onOpenChange={setMapOpen}
/>
```

### 3. **Button Integration:**

```tsx
<Button onClick={() => setMapOpen(true)}>
  <MapPin /> View Map
</Button>
```

## File Structure

```
signagewala/
├── components/
│   └── maps/
│       └── store-locations-map.tsx      # Main map component
├── components/(user)/vendor/orders/
│   └── componets-orders.tsx             # Integrated with map
├── hooks/
│   └── use-vendor-orders.ts            # Updated interface
└── .env.local                          # API key configuration
```

## Error Handling

### 1. **Missing API Key:**
```
Error message: "Failed to load Google Maps. Please check your API key."
Solution: Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
```

### 2. **No Locations:**
```
If order.sites mein koi storeLocation nahi hai:
- Map component gracefully handle karega
- Empty locations array pass hoga
```

### 3. **Script Loading Failure:**
```
Network error or invalid API key:
- Error state show hoga
- User-friendly message with solution
```

## Testing Checklist

- [ ] Google Maps API key add kiya .env.local mein
- [ ] Server restart kiya environment variables load karne ke liye
- [ ] Vendor orders page open kiya
- [ ] Order detail modal open kiya
- [ ] "View Map" button click kiya
- [ ] Map load ho raha hai properly
- [ ] Sab markers show ho rahe hain
- [ ] Marker click karne par info window show hota hai
- [ ] "Open in Google Maps" button new tab mein map open karta hai
- [ ] Multiple locations ka case test kiya
- [ ] Single location ka case test kiya
- [ ] pnpm build successful hai

## Future Enhancements (Optional)

1. **Directions Integration:**
   - User's current location se sab stores tak directions
   - Optimized route for multiple locations

2. **Clustering:**
   - Agar bohot saare markers hain to clustering use karo
   - `@googlemaps/markerclusterer` package

3. **Custom Markers:**
   - Different colors for different site types
   - Custom icons based on order status

4. **Distance Calculation:**
   - Stores ke beech distance show karo
   - Nearest store highlight karo

5. **Street View:**
   - Marker click pe street view show karo
   - Better visualization

## Dependencies

```json
{
  "devDependencies": {
    "@types/google.maps": "^3.58.1"
  }
}
```

## Build & Deployment

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build
pnpm build

# Production
pnpm start
```

## Important Notes

⚠️ **Security:**
- API key ko client-side expose karna padega (NEXT_PUBLIC prefix)
- Production mein API key ko HTTP referrer restrictions se protect karo
- Daily quota monitor karo Google Cloud Console mein

⚠️ **Pricing:**
- Google Maps JavaScript API: $7 per 1000 loads
- Monthly $200 free credit available
- Monitor usage regularly

⚠️ **Performance:**
- Script dynamically load hoti hai (only when map opens)
- Map instance cached rehta hai
- Multiple renders se bachne ke liye useRef use kiya

## Support & Troubleshooting

**Common Issues:**

1. **Map not loading:**
   - Check console for errors
   - Verify API key is correct
   - Check if Maps JavaScript API is enabled

2. **Markers not showing:**
   - Verify coordinates format [longitude, latitude]
   - Check if storeLocation exists in order.sites
   - Console.log locations array to debug

3. **Build errors:**
   - Make sure @types/google.maps is installed
   - Check TypeScript version compatibility

## Conclusion

Successfully implement ho gaya! Ab jab bhi koi vendor order details mein "View Map" button click karega, ek professional Google Maps dialog open hoga with all store locations properly marked. User experience bohot better ho gaya hai location visualization ke liye. 🗺️✨
