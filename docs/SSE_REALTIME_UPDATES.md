# Server-Sent Events (SSE) Real-Time Updates

This project implements real-time database updates using MongoDB Change Streams and Server-Sent Events (SSE), eliminating the need for polling.

## Architecture

### Components

1. **MongoDB Change Streams** (`lib/utils/changeStream.ts`)
   - Monitors MongoDB collections for changes
   - Automatically notifies connected clients

2. **SSE Factory** (`lib/utils/sseFactory.ts`)
   - Reusable factory to create SSE endpoints
   - Handles authentication, filtering, and streaming

3. **SSE Hook** (`lib/hooks/useSSE.ts`)
   - React hook for consuming SSE
   - Auto-reconnect on connection loss
   - Error handling

4. **Updated SWR Hooks**
   - No polling (`refreshInterval: 0`)
   - Real-time updates via SSE
   - `isLive` status indicator

## Usage

### Creating a New SSE Endpoint

```typescript
// app/api/your-collection/sse/route.ts
import YourModel from '@/lib/models/YourModel';
import { createSSEHandler } from '@/lib/utils/sseFactory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = createSSEHandler({
  model: YourModel,
  collectionName: 'yourcollection',
  getUserFilter: (userId) => ({
    'fullDocument.userId': userId, // Filter by user
  }),
  requireAuth: true,
  checkUserType: 'brand', // Optional: restrict to user type
});
```

### Using SSE in a Hook

```typescript
// lib/hooks/useYourData.ts
import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import { useSSE } from './useSSE';

export function useYourData() {
  const { accessToken } = useAuth();

  // Standard SWR fetch (no polling)
  const { data, error, mutate } = useSWR(
    accessToken ? ['/api/your-data/get', accessToken] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0, // No polling!
    }
  );

  // SSE for real-time updates
  const sseUrl = accessToken ? `/api/your-data/sse?token=${accessToken}` : null;
  const { isConnected } = useSSE(sseUrl, {
    enabled: !!accessToken,
    onMessage: (message) => {
      if (message.type === 'change') {
        mutate(); // Refresh data when change occurs
      }
    },
  });

  return {
    data: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
    isLive: isConnected, // Real-time connection status
  };
}
```

### Using in Components

```typescript
export function YourComponent() {
  const { data, isLoading, isLive } = useYourData();

  return (
    <div>
      {isLive && <span>🟢 Live</span>}
      {/* Your component */}
    </div>
  );
}
```

## Current Implementations

### Brand Rates
- **Endpoint**: `/api/brand/rates/sse`
- **Hook**: `useBrandRate()`
- **Filter**: User's own rates only

### Admin Master Rates
- **Endpoint**: `/api/admin/rates/sse`
- **Hook**: `useAdminMasterRate()`
- **Filter**: All master rates (admin only)

### Admin New Element Requests
- **Endpoint**: `/api/admin/rates/new-elements/sse`
- **Hook**: `useNewElementRequests()`
- **Filter**: Only pending new elements

## Benefits

✅ **No Polling** - Zero unnecessary API calls
✅ **Real-time** - Instant updates when data changes
✅ **Efficient** - MongoDB Change Streams are native
✅ **Reusable** - Easy to add to new collections
✅ **Auto-reconnect** - Handles connection drops
✅ **Filtered** - Only relevant data for each user

## Production Considerations

1. **MongoDB Replica Set Required**
   - Change Streams only work with replica sets
   - Configure your MongoDB accordingly

2. **Connection Limits**
   - Monitor concurrent SSE connections
   - Consider load balancing for high traffic

3. **Error Handling**
   - All errors are logged
   - Auto-reconnect on failure

4. **Keep-Alive**
   - 30-second ping to prevent timeouts
   - Configurable in `sseFactory.ts`

## Monitoring

Check console for:
- `SSE connected: <url>` - Successful connection
- `SSE error:` - Connection issues
- `Attempting to reconnect SSE...` - Auto-reconnect

## Future Enhancements

- [ ] Add metrics/monitoring
- [ ] Support for multiple event types
- [ ] Client-side event buffering
- [ ] Configurable reconnect strategy
