# Brand-Manager Real-time Updates

## 🎯 Business Requirement

**Scenario:** Brands assign work to Managers. Managers perform actions in the field (creating rates, adding stores, updating tasks). Brands need to see their managers' progress and updates in **near real-time** without constantly polling the server.

**Solution:** Brand-scoped SSE (Server-Sent Events) for manager activity notifications.

---

## 📐 Architecture Overview

### Core Principle: **SSE = Signal Only, Not Data**

```
┌─────────────────────────────────────────────────────────────┐
│                    BRAND-MANAGER REALTIME FLOW              │
└─────────────────────────────────────────────────────────────┘

Step 1: Manager performs action
┌────────────────────┐
│  Manager creates   │
│  a new rate        │
└─────────┬──────────┘
          │
          ▼
┌────────────────────────────────┐
│ POST /api/manager/rates/post   │
│                                 │
│ 1. Verify JWT (managerId)      │
│ 2. Get TeamMember record        │
│ 3. Extract parentId (brandId)   │
│ 4. Write to MongoDB             │
│ 5. ✅ Success!                  │
└─────────┬──────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│ emitManagerActivityEvent(                   │
│   brandId: user.parentId,                   │
│   managerId: userId,                        │
│   entity: 'rate',                            │
│   metadata: { action: 'created' }           │
│ )                                            │
└─────────┬───────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  SSE Event Emitter (In-Memory)              │
│                                              │
│  Broadcasts event to all listening          │
│  SSE endpoints scoped to this event type    │
└─────────┬────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  SSE Endpoint:                               │
│  /api/brand/manager-activity/sse             │
│                                              │
│  1. Connected brand: brandId = "brand123"    │
│  2. Receives event: brandId = "brand123"     │
│  3. ✅ Match! Send signal                   │
│                                              │
│  Sends lightweight MANAGER_ACTIVITY signal:  │
│  {                                           │
│    type: "MANAGER_ACTIVITY",                │
│    brandId: "brand123",                      │
│    managerId: "mgr456",                      │
│    entity: "rate",                           │
│    eventId: "1738931200000-abc123",         │
│    timestamp: 1738931200000,                │
│    action: "created"                         │
│  }                                           │
└─────────┬────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  Brand Dashboard (Frontend)                  │
│                                              │
│  useManagerActivity({                        │
│    onManagerUpdate: (event) => {             │
│      if (event.entity === 'rate') {          │
│        refetchRates(); // SWR mutate()       │
│      }                                       │
│    }                                         │
│  })                                          │
└─────────┬────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  GET /api/brand/rates/get                    │
│                                              │
│  Fetches fresh data from MongoDB            │
│  ✅ Brand sees updated rates immediately    │
└──────────────────────────────────────────────┘
```

---

## 🔑 Key Concepts

### 1. **SSE is Signal-Only**

**❌ WRONG (Old approach):**
```typescript
// SSE sends full documents
eventSource.onmessage = (event) => {
  const newRate = JSON.parse(event.data);
  setRates([...rates, newRate]); // Using SSE data directly
};
```

**✅ CORRECT (Our approach):**
```typescript
// SSE sends lightweight signal
eventSource.onmessage = (event) => {
  const signal = JSON.parse(event.data);
  if (signal.type === 'MANAGER_ACTIVITY') {
    mutate(); // Refetch from GET API
  }
};
```

**Why?**
- SSE might miss messages (client disconnected, network issues)
- GET APIs are single source of truth
- SSE is just a notification mechanism
- System works even if SSE fails

### 2. **Brand-Scoped Events**

**Each brand only receives events for their own managers:**

```typescript
// Manager belongs to Brand A
Manager (userId: "mgr123", parentId: "brandA")

// Event is scoped to Brand A only
emitManagerActivityEvent(
  "brandA",  // Only Brand A will receive this
  "mgr123",
  "rate",
  { action: "created" }
);

// Brand B's SSE connection: receives nothing ✅
// Brand A's SSE connection: receives signal ✅
```

### 3. **Entity-Based Filtering**

Brands can selectively refetch based on what changed:

```typescript
useManagerActivity({
  onManagerUpdate: (event) => {
    // Smart refetching: only refetch affected resources
    switch (event.entity) {
      case 'rate':
        refetchRates();
        break;
      case 'store':
        refetchStores();
        break;
      case 'racee':
        refetchRacees();
        break;
    }
  },
});
```

### 4. **Debouncing & Deduplication**

**Problem:** 3 managers update rates simultaneously
**Solution:** Debounce refetches into a single call

```typescript
// Manager 1: creates rate → event 1
// Manager 2: creates rate → event 2
// Manager 3: creates rate → event 3

// Without debouncing: 3 GET requests ❌
// With debouncing: 1 GET request after 1 second ✅
```

---

## 🛠️ Implementation Guide

### Backend: Manager Mutation APIs

**Pattern for all POST/PUT/DELETE in manager APIs:**

```typescript
// Example: /api/manager/rates/post/route.ts
import { emitManagerActivityEvent } from '@/lib/utils/sseEventEmitter';

export async function POST(req: NextRequest) {
  // 1. Authenticate & get user
  const user = await User.findById(userId);
  
  // 2. Perform database mutation
  const newRate = await BrandRate.create({ ... });
  
  // 3. ✅ EMIT EVENT AFTER SUCCESS
  if (user.parentId) {
    emitManagerActivityEvent(
      user.parentId.toString(),  // brandId
      userId,                     // managerId
      'rate',                     // entity type
      { action: 'created', elementName }  // optional metadata
    );
  }
  
  // 4. Return response
  return NextResponse.json({ ... });
}
```

**✅ DO:**
- Emit event AFTER successful DB mutation
- Use `user.parentId` to get brandId
- Include entity type ('rate', 'store', 'racee', etc.)

**❌ DON'T:**
- Emit events in GET APIs
- Emit events before DB operations
- Send full documents in metadata

### Backend: SSE Endpoint

**Already implemented:** `/api/brand/manager-activity/sse`

```typescript
// connects to: /api/brand/manager-activity/sse?token=<jwt>
// Authentication: Brand users only
// Filters: Events scoped to this brand's brandId only
// Sends: MANAGER_ACTIVITY signals (no data)
```

**Message Types:**

| Type | When Sent | Frontend Action |
|------|-----------|----------------|
| `CONNECTED` | Initial connection | **IGNORE** - Do NOT refetch |
| `MANAGER_ACTIVITY` | Manager mutation happened | **REFETCH** - Call mutate() |
| `: heartbeat` | Every 30 seconds | **IGNORE** - Keepalive only |

### Frontend: Brand Dashboard

**Step 1: Import the hook**

```typescript
import { useManagerActivity } from '@/hooks/use-manager-activity';
import useSWR from 'swr';
```

**Step 2: Set up SWR for data fetching**

```typescript
const BrandDashboard = () => {
  // Regular SWR hooks for GET APIs
  const { data: rates, mutate: refetchRates } = useSWR(
    '/api/brand/rates/get',
    fetcher
  );
  
  const { data: stores, mutate: refetchStores } = useSWR(
    '/api/brand/stores/get',
    fetcher
  );
  
  const { data: racees, mutate: refetchRacees } = useSWR(
    '/api/brand/racee',
    fetcher
  );
  
  // ...
};
```

**Step 3: Connect to manager activity SSE**

```typescript
// Listen for manager updates
useManagerActivity({
  enabled: true,
  onManagerUpdate: (event) => {
    // Selective refetch based on what changed
    if (event.entity === 'rate') refetchRates();
    if (event.entity === 'store') refetchStores();
    if (event.entity === 'racee') refetchRacees();
    
    // Optional: Show toast notification
    toast.info(`Manager ${event.managerId} updated ${event.entity}`);
  },
});
```

**Complete Example:**

```typescript
import { useManagerActivity } from '@/hooks/use-manager-activity';
import useSWR from 'swr';
import { toast } from 'sonner';

export function BrandDashboard() {
  const { data: managerRates, mutate: refetchRates } = useSWR(
    '/api/brand/rates/get',
    fetcher
  );
  
  const { data: managerStores, mutate: refetchStores } = useSWR(
    '/api/brand/stores/get',
    fetcher
  );

  // Real-time updates via SSE signals
  useManagerActivity({
    onManagerUpdate: (event) => {
      console.log('Manager activity:', event);
      
      // Refetch based on entity type
      switch (event.entity) {
        case 'rate':
          refetchRates();
          toast.success('Manager updated rates');
          break;
        case 'store':
          refetchStores();
          toast.success('Manager updated stores');
          break;
      }
    },
  });

  return (
    <div>
      <h1>Manager Rates</h1>
      {managerRates?.map(rate => (
        <div key={rate._id}>{rate.elementName}</div>
      ))}
      
      <h1>Manager Stores</h1>
      {managerStores?.map(store => (
        <div key={store._id}>{store.storeName}</div>
      ))}
    </div>
  );
}
```

---

## 🚀 Why This Works on Vercel

### Vercel Constraints & Solutions

| Constraint | Why It Matters | Our Solution |
|------------|---------------|--------------|
| **Serverless functions timeout** | Can't run long-lived processes | SSE endpoints are ephemeral, client reconnects automatically |
| **No MongoDB Change Streams** | Requires replica sets, long connections | We use in-memory EventEmitter instead |
| **Functions are stateless** | No persistent memory between invocations | Events are ephemeral, GET APIs are source of truth |
| **Cold starts** | Functions go to sleep | SSE reconnects, no data loss (GET refetches) |

### In-Memory Event Emitter

```typescript
// lib/utils/sseEventEmitter.ts
class SSEEventEmitter extends EventEmitter {
  // Lives ONLY during the serverless function execution
  // Each Vercel instance has its own emitter
  // Events are NOT persisted
}
```

**This is safe because:**
1. ✅ SSE is just a notification, not storage
2. ✅ If event is missed, GET API still returns correct data
3. ✅ If SSE disconnects, frontend reconnects automatically
4. ✅ No database dependencies in SSE handlers

---

## 📋 Developer Rules (MUST FOLLOW)

### ✅ DO:

1. **Always emit events AFTER successful mutations:**
   ```typescript
   const result = await Model.create({ ... });
   emitManagerActivityEvent(brandId, managerId, entity);
   return NextResponse.json({ ... });
   ```

2. **Get brandId from manager's parentId:**
   ```typescript
   const user = await User.findById(userId);
   if (user.parentId) {
     emitManagerActivityEvent(
       user.parentId.toString(),  // ✅ brandId
       userId,
       'rate'
     );
   }
   ```

3. **Use entity types consistently:**
   - `'rate'` - for BrandRate operations
   - `'store'` - for Store operations
   - `'racee'` - for Racee/task operations

4. **Only emit on mutations (POST/PUT/DELETE):**
   ```typescript
   export async function POST(req) {
     // ... mutation logic ...
     emitManagerActivityEvent(...); // ✅
   }
   ```

### ❌ DON'T:

1. **NEVER emit events in GET APIs:**
   ```typescript
   export async function GET(req) {
     const data = await Model.find();
     emitManagerActivityEvent(...); // ❌ NO!
     return NextResponse.json(data);
   }
   ```

2. **NEVER emit before DB operations:**
   ```typescript
   emitManagerActivityEvent(...); // ❌ What if create fails?
   await BrandRate.create({ ... });
   ```

3. **NEVER send full documents in events:**
   ```typescript
   emitManagerActivityEvent(brandId, managerId, 'rate', {
     fullDocument: entireRateObject  // ❌ NO! SSE is signal-only
   });
   ```

4. **NEVER use MongoDB Change Streams:**
   ```typescript
   const changeStream = BrandRate.watch(); // ❌ Not Vercel-safe
   ```

---

## 🧪 Testing Guide

### Test Scenario 1: Manager Creates Rate

**Setup:**
1. Open Brand Dashboard in browser
2. Open Network tab, filter "eventsource"
3. See SSE connection to `/api/brand/manager-activity/sse`

**Action:**
1. Have manager call `POST /api/manager/rates/post`

**Expected:**
1. ✅ SSE sends MANAGER_ACTIVITY signal
2. ✅ Brand dashboard refetches rates
3. ✅ New rate appears in UI
4. ✅ Only ONE GET request triggered

### Test Scenario 2: Multiple Managers Update

**Setup:**
1. 3 managers update different entities within 2 seconds

**Action:**
1. Manager 1: Creates rate
2. Manager 2: Creates store
3. Manager 3: Updates racee

**Expected:**
1. ✅ 3 SSE signals sent
2. ✅ Debouncing: refetchRates, refetchStores, refetchRacees called once each
3. ✅ NOT: 3 immediate GET requests per entity

### Test Scenario 3: SSE Disconnect/Reconnect

**Setup:**
1. Brand dashboard connected

**Action:**
1. Disable network for 3 seconds
2. Re-enable network

**Expected:**
1. ✅ SSE reconnects automatically
2. ✅ CONNECTED event sent (ignored by frontend)
3. ✅ NO refetch triggered by reconnection
4. ✅ Next manager action triggers normal refetch

### Test Scenario 4: Page Refresh

**Setup:**
1. Brand dashboard loaded

**Action:**
1. Refresh page (F5)

**Expected:**
1. ✅ Initial data loaded via GET APIs
2. ✅ SSE connects
3. ✅ CONNECTED event sent (ignored)
4. ✅ NO unnecessary refetches

---

## 📊 Performance Characteristics

### Request Patterns

| Scenario | Without SSE | With SSE (Our Impl) |
|----------|-------------|---------------------|
| **Idle (no manager activity)** | Polling every 5s = 720 req/hr | 0 requests |
| **1 manager creates rate** | Next poll = 1 GET | 1 SSE signal → 1 GET |
| **3 managers update in 1 sec** | Next poll = 1 GET (misses timing) | 3 signals → 1 debounced GET |
| **SSE disconnects** | - | Auto-reconnect, no data loss |

### Scalability

**Per Brand:**
- 1 SSE connection
- Receives only their managers' events
- No cross-brand pollution

**Per Manager Action:**
- 1 event emission (O(1) operation)
- Lightweight signal (<200 bytes)
- No database queries in SSE

**100 Brands, 10 Managers Each:**
- Total SSE connections: 100
- Manager creates 1 rate: 1 event → 1 brand notified
- NOT: Broadcast to all 100 brands

---

## 🔧 Configuration

### SSE Reconnection

```typescript
useManagerActivity({
  reconnectInterval: 3000, // Reconnect after 3s on disconnect
});
```

### Debouncing

```typescript
useManagerActivity({
  debounceMs: 1000, // Wait 1s before triggering refetch
});
```

**Recommendations:**
- High-frequency updates: 1000-2000ms
- Low-frequency updates: 500ms
- Real-time critical: 200ms (minimum)

---

## 📂 File Structure

```
app/api/
  brand/
    manager-activity/
      sse/
        route.ts                    # NEW: SSE endpoint for brands
  manager/
    rates/
      post/route.ts                 # UPDATED: Emits events
      put/route.ts                  # UPDATED: Emits events
      delete/route.ts               # UPDATED: Emits events
    stores/
      post/route.ts                 # UPDATED: Emits events
      put/route.ts                  # UPDATED: Emits events
      delete/route.ts               # UPDATED: Emits events
    racee/
      add-site/route.ts             # UPDATED: Emits events
      delete-site/route.ts          # UPDATED: Emits events
      update-status/route.ts        # UPDATED: Emits events
      update-store-location/route.ts # UPDATED: Emits events
      update-store-photo/route.ts   # UPDATED: Emits events

hooks/
  use-manager-activity.ts           # NEW: Frontend hook

lib/utils/
  sseEventEmitter.ts                # UPDATED: Added brand-scoped events
```

---

## 🆘 Troubleshooting

### Problem: Brand not receiving manager updates

**Check:**
1. Is SSE connected? (Network tab → EventSource)
2. Does manager's `user.parentId` match brand's `userId`?
3. Are events being emitted? (Add console.log in mutation API)
4. Is `onManagerUpdate` callback defined?

**Debug:**
```typescript
useManagerActivity({
  onManagerUpdate: (event) => {
    console.log('RECEIVED EVENT:', event); // Should log on manager action
  },
  onError: (error) => {
    console.error('SSE ERROR:', error);
  },
});
```

### Problem: Multiple refetches for single action

**Check:**
1. Are multiple components calling mutate()?
2. Is debouncing configured?
3. Are event IDs being deduplicated?

**Solution:**
```typescript
// Centralize SSE hookto one place
// In App.tsx or layout
useManagerActivity({ ... });

// Other components just use SWR data
const { data } = useSWR(...); // No SSE here
```

### Problem: Stale data after manager update

**Check:**
1. Is mutate() being called correctly?
2. Is GET API returning fresh data?
3. Is SWR cache invalidated?

**Solution:**
```typescript
useManagerActivity({
  onManagerUpdate: (event) => {
    mutate(undefined, { revalidate: true }); // Force refetch
  },
});
```

---

## 📚 Related Documentation

- [SSE_STORM_FIX.md](SSE_STORM_FIX.md) - How we fixed SSE request storms
- [SSE_REFACTOR.md](SSE_REFACTOR.md) - Original SSE architecture refactoring
- [SSE_IMPLEMENTATION_GUIDE.md](docs/SSE_IMPLEMENTATION_GUIDE.md) - General SSE patterns

---

## ✅ Sign-Off

**Implemented by:** Senior System Architect  
**Date:** February 9, 2026  
**Build Status:** ✅ Passed  
**Routes Added:** 1 new SSE endpoint (`/api/brand/manager-activity/sse`)  
**Routes Updated:** 11 manager mutation APIs  
**Frontend Hooks:** 1 new hook (`useManagerActivity`)  
**TypeScript:** All checks passed  
**Vercel-Compatible:** Yes  
**Production-Ready:** Yes  

**Key Benefits:**
- ✅ Brands see manager updates in real-time
- ✅ No polling overhead (0 requests when idle)
- ✅ Brand-scoped (no cross-brand leaks)
- ✅ Debounced (efficient even with many managers)
- ✅ Vercel-safe (no Change Streams, no long-lived connections)
- ✅ Resilient (works even if SSE disconnects)

---

**END OF DOCUMENT**
