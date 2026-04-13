# SSE Removal Documentation

## Overview
This document describes the complete removal of Server-Sent Events (SSE) infrastructure from the project and its replacement with useSWR's built-in revalidation mechanism.

## Change Summary

### Previous Architecture (SSE-based)
- **Real-time Updates**: Background SSE connections for live data sync
- **Event Emissions**: Server-side event broadcasting using `broadcastUpdate()`, `emitManagerActivityEvent()`
- **Live Indicators**: UI badges showing connection status
- **Polling Disabled**: `revalidateOnFocus: false`, `refreshInterval: 0`

### New Architecture (useSWR-based)
- **Focus-based Updates**: Data refreshes when window gains focus
- **Reconnect Updates**: Data refreshes on network reconnection
- **No Background Connections**: No persistent server connections
- **Manual Refetch**: Explicit `mutate()` calls where immediate updates needed
- **Simpler Stack**: Removed SSE complexity entirely

## Files Modified

### 1. SSE Endpoints Deleted (13 total)

All SSE endpoint directories were completely removed:

1. `app/api/vendor/rates/sse/`
2. `app/api/vendor/work-authority/sse/`
3. `app/api/manager/stores/sse/`
4. `app/api/manager/work-authority/sse/`
5. `app/api/manager/rates/sse/`
6. `app/api/brand/rates/sse/`
7. `app/api/brand/work-authority/sse/`
8. `app/api/brand/stores/sse/`
9. `app/api/brand/racee/sse/`
10. `app/api/brand/purchase-authority/sse/`
11. `app/api/admin/rates/sse/`
12. `app/api/admin/users/sse/`
13. `app/api/admin/rates/new-elements/sse/`

**Impact**: Removed all real-time SSE server endpoints and their event broadcasting logic.

---

### 2. Hooks Converted to useSWR (11 files)

All hooks were refactored from SSE+useSWR hybrid to pure useSWR:

#### lib/hooks/useAdminMasterRate.ts
**Before:**
```typescript
import { useSSE } from './useSSE';

const { data, error, mutate } = useSWR(..., {
  revalidateOnFocus: false,
  refreshInterval: 0,
});

const sseUrl = accessToken ? `/api/admin/rates/sse?token=${accessToken}` : null;
const { isConnected } = useSSE(sseUrl, {
  enabled: !!accessToken,
  onMessage: (message) => {
    if (message.type === 'change') mutate();
  },
});

return { rates, isLoading, isError, mutate, isLive: isConnected };
```

**After:**
```typescript
const { data, error, mutate } = useSWR(..., {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
});

return { rates, isLoading, isError, mutate };
```

**Same pattern applied to:**
- `lib/hooks/useBrandRate.ts`
- `lib/hooks/useManagerRates.ts`
- `lib/hooks/useVendorRate.ts`
- `lib/hooks/useStores.ts`
- `lib/hooks/useManagerStores.ts`
- `lib/hooks/useWorkAuthority.ts`
- `lib/hooks/useManagerWorkAuthority.ts`
- `lib/hooks/useNewElementRequests.ts`

#### hooks/use-users.ts
**Before:**
```typescript
import { useEffect } from 'react';

const { data, error, mutate } = useSWR(..., {
  revalidateOnFocus: false,
});

useEffect(() => {
  if (!accessToken) return;
  const eventSource = new EventSource(`/api/admin/users/sse?token=${accessToken}`);
  eventSource.addEventListener('change', () => mutate());
  return () => eventSource.close();
}, [accessToken, mutate]);
```

**After:**
```typescript
const { data, error, mutate } = useSWR(..., {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
});
```

#### lib/hooks/usePurchaseAuthority.ts
**Before:**
```typescript
const [authorities, setAuthorities] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const eventSource = new EventSource(...);
  eventSource.onmessage = (event) => {
    setAuthorities(JSON.parse(event.data));
    setIsLoading(false);
  };
  return () => eventSource.close();
}, []);

return { authorities, isLoading, error, refetch: () => {...} };
```

**After:**
```typescript
const { data, error, mutate } = useSWR(..., {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
});

return { 
  authorities: data || [], 
  isLoading: !error && !data, 
  error, 
  refetch: mutate 
};
```

**Impact**: Removed all SSE connection logic, simplified data fetching, enabled automatic revalidation on focus/reconnect.

---

### 3. Manager Racee Routes (5 files)

Removed `broadcastUpdate()` calls from all manager racee modification routes:

#### Files Modified:
- `app/api/manager/racee/update-status/route.ts`
- `app/api/manager/racee/add-site/route.ts`
- `app/api/manager/racee/delete-site/route.ts`
- `app/api/manager/racee/update-store-location/route.ts`
- `app/api/manager/racee/update-store-photo/route.ts`

**Changes:**
```typescript
// REMOVED:
import { broadcastUpdate } from '@/app/api/brand/racee/sse/route';

// REMOVED:
if (racee.parentId) {
  broadcastUpdate(racee.parentId.toString()).catch(err => 
    console.error('Failed to broadcast update:', err)
  );
}
```

**Impact**: Removed server-side event broadcasts. Updates now happen via client-side useSWR revalidation.

---

### 4. Type Definitions Updated (3 files)

Removed `isLive` property from hook return types:

#### types/vendor-rate.types.ts
```typescript
export interface UseVendorRateReturn {
  rates: VendorRate[];
  isLoading: boolean;
  isError: boolean;
  mutate: KeyedMutator<VendorRate[]>;
  // REMOVED: isLive?: boolean;
}
```

#### types/master-rate.types.ts
```typescript
export interface UseMasterRateReturn {
  rates: MasterRate[];
  isLoading: boolean;
  isError: boolean;
  mutate: KeyedMutator<MasterRate[]>;
  // REMOVED: isLive?: boolean;
}
```

#### types/brand-rate.types.ts
```typescript
export interface UseBrandRateReturn {
  rates: BrandRate[];
  isLoading: boolean;
  isError: boolean;
  mutate: KeyedMutator<BrandRate[]>;
  // REMOVED: isLive?: boolean;
}
```

**Impact**: Type definitions now accurately reflect hook returns without SSE connection status.

---

### 5. Components Updated (4 files)

Removed `isLive` destructuring and live indicator UI from all components:

#### components/(user)/brand/stores/components-all-store.tsx
```typescript
// BEFORE:
const { stores, isLoading, isError, isSearching, mutate, isLive } = useStores();

<h2 className="text-2xl font-bold">Stores</h2>
{isLive && (
  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full">
    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
    <span className="text-xs font-medium text-green-700 dark:text-green-300">Live</span>
  </div>
)}

// AFTER:
const { stores, isLoading, isError, isSearching, mutate } = useStores();

<h2 className="text-2xl font-bold">Stores</h2>
```

**Same pattern applied to:**
- `modules/brands/stores/components-manager-stores.tsx`
- `modules/brands/racee/components-manager-racee.tsx`
- `modules/brands/rates/components-manager-rate.tsx`

**Impact**: UI no longer shows SSE connection status. Data remains fresh via focus-based revalidation.

---

### 6. Utility Files Deleted (4 files)

Complete removal of SSE infrastructure utilities:

1. **lib/hooks/useSSE.ts**
   - Custom SSE hook for managing EventSource connections
   - Handled connection status, reconnection, error states

2. **lib/utils/sseEventEmitter.ts**
   - Server-side event emission system
   - Managed active SSE connections and message broadcasting

3. **lib/utils/sseFactory.ts**
   - Factory utilities for creating SSE endpoints
   - Standardized SSE response formatting

4. **lib/utils/changeStream.ts**
   - MongoDB change stream utilities
   - Database-level change detection for SSE

**Impact**: Complete removal of SSE infrastructure. Simplified codebase with no SSE dependencies.

---

## Configuration Changes

### useSWR Hook Configuration

**Before (SSE-based):**
```typescript
useSWR(key, fetcher, {
  revalidateOnFocus: false,     // Disabled auto-refetch
  revalidateOnReconnect: false, // Disabled reconnect refetch
  refreshInterval: 0,           // No polling
  // Relied on SSE for updates
});
```

**After (Focus-based):**
```typescript
useSWR(key, fetcher, {
  revalidateOnFocus: true,      // ✅ Refetch on window focus
  revalidateOnReconnect: true,  // ✅ Refetch on network reconnect
  // No SSE needed
});
```

### Data Update Mechanism

| Aspect | SSE (Before) | useSWR (After) |
|--------|-------------|----------------|
| **Update Trigger** | Server push via EventSource | Window focus, network reconnect |
| **Latency** | <1s (real-time) | 0-5s (on user action) |
| **Connection** | Persistent HTTP connection | HTTP request on-demand |
| **Server Load** | Moderate (maintains connections) | Low (only on user activity) |
| **Complexity** | High (SSE endpoints, event emitters) | Low (standard REST + useSWR) |
| **Manual Refetch** | `mutate()` available | `mutate()` available |

---

## Migration Benefits

### 1. **Simplified Architecture**
- ❌ Removed 13 SSE endpoint directories
- ❌ Removed 4 SSE utility files
- ❌ Removed EventSource connection management
- ✅ Pure REST API + useSWR hooks

### 2. **Reduced Server Load**
- No persistent SSE connections to maintain
- No server-side event broadcasting
- Fewer concurrent HTTP connections

### 3. **Better Resource Management**
- No memory leaks from unclosed EventSource connections
- No client-side SSE reconnection logic
- Automatic cleanup via useSWR

### 4. **Improved Developer Experience**
- Simpler hook implementation (10-15 lines vs 30-40 lines)
- Standard useSWR patterns throughout codebase
- Less debugging of SSE-specific issues

### 5. **User Experience Trade-off**
- ⚠️ Updates not instant (appear on window focus)
- ✅ Consistent behavior across all data
- ✅ No "Live" connection anxiety for users

---

## Manual Mutate Usage

When immediate data refresh is needed, call `mutate()` explicitly:

### Example: After Creating a Store
```typescript
const { stores, mutate } = useStores();

const handleCreateStore = async (storeData) => {
  await fetch('/api/brand/stores/post', {
    method: 'POST',
    body: JSON.stringify(storeData),
  });
  
  // ✅ Immediately refresh stores list
  mutate();
};
```

### Example: After Updating Status
```typescript
const { racees, mutate } = useManagerRacee();

const handleUpdateStatus = async (raceeId, status) => {
  await fetch('/api/manager/racee/update-status', {
    method: 'POST',
    body: JSON.stringify({ raceeId, status }),
  });
  
  // ✅ Immediately refresh racee list
  mutate();
};
```

---

## Behavior Changes

### Data Refresh Scenarios

| Event | SSE (Before) | useSWR (After) |
|-------|--------------|----------------|
| Another user creates store | ✅ Updates immediately | ⏱️ Updates on next window focus |
| Network reconnects | ✅ Reconnects SSE | ✅ Refetches data |
| User switches browser tabs | ❌ No update | ✅ Refetches on return |
| User clicks create button | ✅ SSE update + manual mutate | ✅ Manual mutate only |
| Page stays open for hours | ✅ Live updates | ⏱️ Stale until focus/manual refresh |

### Key Differences

1. **Multi-user collaboration**: Updates appear when users switch back to the tab, not instantly
2. **Stale data prevention**: Automatic refresh on focus prevents showing outdated data
3. **Network issues**: Better recovery with `revalidateOnReconnect: true`
4. **Manual control**: `mutate()` still available for immediate updates

---

## Testing Verification

### Build Status
✅ **Production build successful**
```
✓ Compiled successfully in 22.4s
✓ Finished TypeScript in 30.7s
✓ Generating static pages (177/177) in 5.2s
```

### Type Safety
✅ **No TypeScript errors**
- All `isLive` references removed
- Hook return types updated
- Component destructuring corrected

### Runtime Verification
To verify the new behavior works correctly:

1. **Test focus-based revalidation:**
   - Open a stores/rates page
   - Switch to another tab
   - Create/update data from another device
   - Switch back to original tab
   - ✅ Data should refresh automatically

2. **Test manual mutate:**
   - Create/update data using the UI
   - ✅ UI should update immediately after operation

3. **Test network reconnection:**
   - Disconnect network
   - Reconnect network
   - ✅ Data should refresh on reconnect

---

## Rollback Instructions

If SSE functionality needs to be restored:

### 1. Restore Endpoints
```bash
git restore app/api/*/sse/
```

### 2. Restore Utilities
```bash
git restore lib/hooks/useSSE.ts
git restore lib/utils/sseEventEmitter.ts
git restore lib/utils/sseFactory.ts
git restore lib/utils/changeStream.ts
```

### 3. Restore Hooks
Revert all 11 hook files to their SSE-enabled versions

### 4. Restore Components
Add back `isLive` destructuring and UI indicators

### 5. Restore Types
Add back `isLive?: boolean` to hook return types

---

## Related Documentation

- [JWT Authentication Guide](./JWT_AUTHENTICATION_GUIDE.md)
- [Manager Dynamic Modules](./MANAGER_DYNAMIC_MODULES.md)
- [SSE Implementation Summary](./SSE_IMPLEMENTATION_SUMMARY.md) *(Historical reference)*
- [SSE Real-time Updates](./SSE_REALTIME_UPDATES.md) *(Historical reference)*

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-01-XX | AI Assistant | Complete SSE removal and useSWR migration |

---

## Conclusion

This migration successfully removed all SSE infrastructure from the project while maintaining data freshness through useSWR's focus-based revalidation. The new architecture is simpler, more maintainable, and follows standard React data fetching patterns.

**Trade-offs:**
- ✅ Simpler codebase (-500+ lines of SSE code)
- ✅ Lower server resource usage
- ✅ Standard patterns (useSWR only)
- ⚠️ Updates delayed until window focus (acceptable for most use cases)

**Recommendation:** Monitor user feedback regarding data freshness. If users need instant updates, consider adding strategic `mutate()` calls or websockets for specific high-priority features only.
