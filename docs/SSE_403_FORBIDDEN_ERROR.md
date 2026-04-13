# SSE 403 Forbidden Error - Solution Guide

## Error Overview

### Error Message:
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
GET /api/manager/work-authority/sse?token=xxx 403 (Forbidden)
Attempting to reconnect SSE...
```

### Error Pattern:
```
useSSE.ts:75 Attempting to reconnect SSE...
sse:1 GET http://localhost:3000/api/manager/work-authority/sse?token=xxx 403 (Forbidden)
```

---

## Root Cause Analysis

### Problem:
**Brand/Vendor user** trying to access **Manager-only SSE endpoint**

### JWT Token Decoded:
```json
{
  "userId": "693e70c8fd952aa2071cdb3b",
  "email": "mmukesh1508@gmail.com",
  "userType": "brand",  // ❌ Not a manager!
  "iat": 1767089607,
  "exp": 1767176007
}
```

### Endpoint Access Control:
```typescript
// app/api/manager/work-authority/sse/route.ts
export const GET = createSSEHandler({
  model: WorkAuthority,
  collectionName: 'workauthorities',
  requireAuth: true,
  checkUserType: 'manager', // ✅ Only managers allowed
});
```

### Issue Chain:
1. **Sidebar component** calls `useManagerWorkAuthority()` for ALL users
2. Hook tries to connect to `/api/manager/work-authority/sse`
3. SSE endpoint checks `userType === 'manager'`
4. Brand user has `userType: 'brand'`
5. ❌ 403 Forbidden returned
6. EventSource auto-reconnects every few seconds
7. 🔄 Infinite reconnection loop

---

## Solution Implementation

### Step 1: Add UserType Check in Hook

**File:** `lib/hooks/useManagerWorkAuthority.ts`

**Before (❌ Wrong):**
```typescript
export function useManagerWorkAuthority() {
  const { accessToken } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    accessToken ? ['/api/manager/work-authority', accessToken] : null,
    // ❌ Fetches for ALL users (brand, vendor, manager)
  );

  const sseUrl = accessToken 
    ? `/api/manager/work-authority/sse?token=${accessToken}` 
    : null;
  // ❌ SSE connects for ALL users
}
```

**After (✅ Correct):**
```typescript
export function useManagerWorkAuthority() {
  const { accessToken, user } = useAuth();
  
  // ✅ Only fetch if user is manager
  const isManager = user?.userType === 'manager';
  
  const { data, error, isLoading, mutate } = useSWR(
    accessToken && isManager 
      ? ['/api/manager/work-authority', accessToken] 
      : null, // ✅ Returns null for non-managers
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }
  );

  // ✅ SSE only for managers
  const sseUrl = (accessToken && isManager) 
    ? `/api/manager/work-authority/sse?token=${accessToken}` 
    : null;
    
  const { isConnected } = useSSE(sseUrl, {
    enabled: !!accessToken && isManager, // ✅ Conditional enable
    onMessage: (message) => {
      if (message.type === 'change') {
        mutate();
      }
    },
  });
}
```

---

### Step 2: Add Safety Check in Permissions Hook

**File:** `lib/hooks/useManagerPermissions.ts`

**Before (❌ Wrong):**
```typescript
export function useManagerPermissions(moduleName: string) {
  const { authorities, isLoading } = useManagerWorkAuthority();
  
  if (isLoading) {
    return { hasAccess: false, ... };
  }
  // ❌ Continues for non-managers
}
```

**After (✅ Correct):**
```typescript
import { useAuth } from '@/lib/context/AuthContext';

export function useManagerPermissions(moduleName: string) {
  const { authorities, isLoading } = useManagerWorkAuthority();
  const { user } = useAuth();

  // ✅ Early return for non-managers
  if (user?.userType !== 'manager') {
    return {
      hasAccess: false,
      canAdd: false,
      canEdit: false,
      canView: false,
      canDelete: false,
      canRequest: false,
    };
  }

  if (isLoading) {
    return { hasAccess: false, ... };
  }
  
  // Continue with normal logic for managers
}
```

---

### Step 3: Fix Sidebar Component

**File:** `components/layouts/sidebar.tsx`

**Before (❌ Wrong):**
```typescript
const {
  authorities: workAuthorities,
  isLoading: workLoading,
  isError: workError,
} = useManagerWorkAuthority();
// ❌ Called for ALL users
```

**After (✅ Correct):**
```typescript
// ✅ Only fetch for managers
const shouldFetchManagerWorkAuthorities = user?.userType === 'manager';

const {
  authorities: workAuthorities,
  isLoading: workLoading,
  isError: workError,
} = useManagerWorkAuthority();

// Later in code...
const safeWorkAuthorities =
  shouldFetchManagerWorkAuthorities && !workError 
    ? workAuthorities 
    : [];
```

---

## Testing & Verification

### Test 1: Brand User Login
```typescript
// Expected behavior
✅ No SSE connection to /api/manager/work-authority/sse
✅ No 403 errors in console
✅ Sidebar shows brand navigation only
```

### Test 2: Manager User Login
```typescript
// Expected behavior
✅ SSE connects to /api/manager/work-authority/sse
✅ Work authorities fetched successfully
✅ Dynamic sidebar built from permissions
✅ Live indicator shows green dot
```

### Test 3: Vendor User Login
```typescript
// Expected behavior
✅ No SSE connection to manager endpoints
✅ No 403 errors
✅ Vendor navigation displayed
```

---

## Common SSE 403 Error Patterns

### Pattern 1: Wrong UserType Accessing Endpoint

**Error:**
```
Brand user → /api/manager/stores/sse → 403
```

**Fix:**
```typescript
// In hook
const isManager = user?.userType === 'manager';
const sseUrl = isManager ? '/api/manager/stores/sse?token=...' : null;
```

---

### Pattern 2: Missing UserType in Token

**Error:**
```
Token: { userId: "xxx" } // ❌ No userType
Endpoint: checkUserType: 'brand' → 403
```

**Fix:**
```typescript
// Ensure JWT includes userType
const token = generateAccessToken({
  userId: user._id,
  email: user.email,
  userType: user.userType, // ✅ Include this
});
```

---

### Pattern 3: Multiple UserTypes Accessing Same Endpoint

**Error:**
```
Admin, Brand, Manager all need same data
Endpoint: checkUserType: 'admin' → Brand gets 403
```

**Fix Option 1 - Multiple UserTypes:**
```typescript
export const GET = createSSEHandler({
  checkUserType: ['admin', 'brand', 'manager'], // ✅ Array
});
```

**Fix Option 2 - Separate Endpoints:**
```typescript
// /api/admin/resource/sse - admins only
// /api/brand/resource/sse - brands only
// /api/manager/resource/sse - managers only
```

---

## Prevention Checklist

### When Creating New SSE Endpoints:

- [ ] Define `checkUserType` clearly
- [ ] Document which users can access
- [ ] Add userType check in hook
- [ ] Use conditional SWR key (return null for wrong users)
- [ ] Add conditional SSE enable flag
- [ ] Test with all user types
- [ ] Check console for 403 errors
- [ ] Verify no infinite reconnection loops

### When Creating New Hooks:

- [ ] Import `useAuth` to get user context
- [ ] Check `user?.userType` before fetching
- [ ] Return null/undefined for unauthorized users
- [ ] Don't trigger SSE for wrong user types
- [ ] Add early returns with default values
- [ ] Document required user types

---

## Debugging Commands

### Check JWT Token:
```bash
# Decode token in console
const token = "eyJhbGci...";
JSON.parse(atob(token.split('.')[1]));
```

### Network Tab Inspection:
```
1. Open DevTools → Network
2. Filter: "sse" or "EventSource"
3. Check request headers → Authorization
4. Check response status (should be 200, not 403)
5. See messages in EventStream tab
```

### Console Logging:
```typescript
// In hook
console.log('User Type:', user?.userType);
console.log('Is Manager:', isManager);
console.log('SSE URL:', sseUrl);
console.log('SSE Enabled:', !!accessToken && isManager);
```

---

## Error Resolution Summary

| User Type | Should Access Manager SSE? | Solution |
|-----------|---------------------------|----------|
| Manager   | ✅ Yes                    | Normal flow |
| Brand     | ❌ No                     | Return null in hook |
| Vendor    | ❌ No                     | Return null in hook |
| Admin     | ❌ No                     | Separate endpoint |

---

## Related Files Modified

1. ✅ `lib/hooks/useManagerWorkAuthority.ts` - Added userType check
2. ✅ `lib/hooks/useManagerPermissions.ts` - Added early return
3. ✅ `components/layouts/sidebar.tsx` - Added conditional variable

---

## Key Takeaways

1. **Always check userType** before calling role-specific hooks
2. **Conditional SWR keys** prevent unnecessary API calls
3. **Conditional SSE enable** prevents 403 loops
4. **Early returns** in hooks for unauthorized users
5. **Clear error messages** help debugging

---

## Before vs After

### Before Fix:
```
Brand Login → Sidebar loads → useManagerWorkAuthority() called
→ SSE connects → 403 Forbidden → Reconnect → 403 → Infinite loop ❌
```

### After Fix:
```
Brand Login → Sidebar loads → useManagerWorkAuthority() called
→ isManager = false → SWR key = null → No API call
→ SSE url = null → No connection → Clean ✅
```

---

**Problem Solved! ✨**

No more 403 errors for non-manager users trying to access manager SSE endpoints.
