# Server-Sent Events (SSE) Implementation Guide

## Table of Contents
1. [What is SSE?](#what-is-sse)
2. [Why Use SSE?](#why-use-sse)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Steps](#implementation-steps)
5. [SSE Factory Pattern](#sse-factory-pattern)
6. [Real-World Examples](#real-world-examples)
7. [Multi-Collection SSE](#multi-collection-sse)
8. [Client-Side Integration](#client-side-integration)
9. [Best Practices](#best-practices)
10. [Debugging](#debugging)
11. [Common Issues](#common-issues)

---

## What is SSE?

**Server-Sent Events (SSE)** is a server push technology that allows a server to push real-time updates to clients over HTTP.

### Key Characteristics:
- ✅ **One-way communication** (server → client)
- ✅ **Automatic reconnection** on disconnect
- ✅ **Event-based** message format
- ✅ **Built into browsers** (EventSource API)
- ✅ **HTTP protocol** (no WebSocket needed)
- ✅ **Text-based** (JSON over text/event-stream)

### SSE vs WebSocket vs Polling

| Feature | SSE | WebSocket | Polling |
|---------|-----|-----------|---------|
| Direction | Server → Client | Bidirectional | Client → Server |
| Protocol | HTTP | WS/WSS | HTTP |
| Reconnection | Automatic | Manual | N/A |
| Browser Support | Wide | Wide | Universal |
| Overhead | Low | Medium | High |
| Real-time | Yes | Yes | Delayed |
| Use Case | Live feeds, notifications | Chat, gaming | Simple updates |

---

## Why Use SSE?

### Use Cases:
1. **Live Data Feeds**
   - Stock prices
   - Sports scores
   - News updates

2. **Notifications**
   - New messages
   - Status changes
   - Alerts

3. **Dashboard Updates**
   - Analytics
   - Monitoring
   - Real-time metrics

4. **Collaborative Features**
   - Document changes
   - User presence
   - Activity streams

### Benefits:
- ⚡ **Real-time updates** without polling
- 🔋 **Lower server load** (no repeated requests)
- 🚀 **Better UX** (instant feedback)
- 📉 **Reduced bandwidth** usage
- 🔌 **Simple implementation** (standard HTTP)

---

## Architecture Overview

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Component mounts                                        │
│     ↓                                                       │
│  2. useSSE() hook connects                                  │
│     ↓                                                       │
│  3. EventSource('/api/endpoint/sse?token=xxx')             │
│     │                                                       │
│     └─────────────── HTTP GET ──────────────────────────┐  │
│                                                          │  │
└──────────────────────────────────────────────────────────┼──┘
                                                           │
                                                           ▼
┌──────────────────────────────────────────────────────────────┐
│                         SERVER                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SSE Endpoint (/api/endpoint/sse)                         │
│     ↓                                                        │
│  2. Verify JWT token                                         │
│     ↓                                                        │
│  3. Create ReadableStream                                    │
│     ↓                                                        │
│  4. Setup MongoDB Change Stream                              │
│     ↓                                                        │
│  5. Watch for changes (insert/update/delete)                 │
│     │                                                        │
│     └──────── On Change ──────────┐                         │
│                                   │                         │
│                                   ▼                         │
│     ┌─────────────────────────────────────────┐            │
│     │  MongoDB Collection                     │            │
│     │  ┌───────────┬───────────┬───────────┐ │            │
│     │  │ Document  │ Document  │ Document  │ │            │
│     │  └───────────┴───────────┴───────────┘ │            │
│     └─────────────────────────────────────────┘            │
│                    │                                        │
│                    │ Change detected                        │
│                    ▼                                        │
│  6. Send SSE event to client                                │
│     data: {"type": "change", "operation": "update"}         │
│     │                                                        │
│     └─────────────── SSE Stream ────────────────────────┐  │
│                                                          │  │
└──────────────────────────────────────────────────────────┼──┘
                                                           │
                                                           ▼
┌──────────────────────────────────────────────────────────┼──┐
│                        CLIENT                            │  │
├──────────────────────────────────────────────────────────┼──┤
│                                                          │  │
│  7. EventSource receives message ◄───────────────────────┘  │
│     ↓                                                       │
│  8. onMessage callback triggered                            │
│     ↓                                                       │
│  9. mutate() called                                         │
│     ↓                                                       │
│ 10. SWR refetches data                                      │
│     ↓                                                       │
│ 11. UI re-renders with new data                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create SSE Endpoint

**File:** `app/api/[resource]/sse/route.ts`

```typescript
import { createSSEHandler } from '@/lib/utils/sseFactory';
import YourModel from '@/lib/models/YourModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = createSSEHandler({
  model: YourModel,
  collectionName: 'yourmodels',
  getUserFilter: (userId: string) => ({
    'fullDocument.createdId': userId,
    'fullDocument.isActive': true,
  }),
  requireAuth: true,
  checkUserType: 'brand', // optional
});
```

### Step 2: Create Custom Hook

**File:** `lib/hooks/useYourResource.ts`

```typescript
import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import { useSSE } from './useSSE';

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function useYourResource() {
  const { accessToken } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    accessToken ? ['/api/your-resource', accessToken] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      refreshInterval: 0, // Disable polling - using SSE
    }
  );

  // Setup SSE
  const sseUrl = accessToken 
    ? \`/api/your-resource/sse?token=\${accessToken}\` 
    : null;
    
  const { isConnected } = useSSE(sseUrl, {
    enabled: !!accessToken,
    onMessage: (message) => {
      if (message.type === 'change') {
        mutate(); // Trigger refetch
      }
    },
  });

  return {
    data: data?.data || [],
    isLoading,
    isError: error,
    mutate,
    isLive: isConnected,
  };
}
```

### Step 3: Use in Component

```typescript
'use client';

import { useYourResource } from '@/lib/hooks/useYourResource';

export default function YourComponent() {
  const { data, isLoading, isLive } = useYourResource();

  return (
    <div>
      {/* Live Indicator */}
      {isLive && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      )}
      
      {/* Your data */}
      {data.map(item => <div key={item._id}>{item.name}</div>)}
    </div>
  );
}
```

---

## SSE Factory Pattern

### Factory Function: `createSSEHandler()`

**File:** `lib/utils/sseFactory.ts`

```typescript
interface SSEConfig {
  model: Model<any>;
  collectionName: string;
  getUserFilter?: (userId: string) => object;
  requireAuth?: boolean;
  checkUserType?: string | string[];
}

export function createSSEHandler(config: SSEConfig) {
  return async function GET(req: NextRequest) {
    // 1. Authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '') 
                  || req.nextUrl.searchParams.get('token');
    
    if (!token) return new Response('Unauthorized', { status: 401 });
    
    const decoded = verifyAccessToken(token);
    if (!decoded) return new Response('Unauthorized', { status: 401 });

    // 2. User type check
    if (config.checkUserType) {
      const allowed = Array.isArray(config.checkUserType) 
        ? config.checkUserType 
        : [config.checkUserType];
      if (!allowed.includes(decoded.userType)) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    // 3. Setup SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send connection message
        controller.enqueue(
          encoder.encode(\`data: \${JSON.stringify({ 
            type: 'connected', 
            collection: config.collectionName 
          })}\\n\\n\`)
        );

        await connectDB();

        // 4. Create MongoDB change stream
        const collection = config.model.collection;
        const streamId = \`\${config.collectionName}-\${decoded.userId}-\${Date.now()}\`;
        
        const filter = config.getUserFilter 
          ? [{ $match: config.getUserFilter(decoded.userId) }]
          : [];

        startChangeStream(
          collection,
          streamId,
          (change) => {
            // 5. Send changes to client
            if (['insert', 'update', 'delete'].includes(change.operationType)) {
              controller.enqueue(
                encoder.encode(\`data: \${JSON.stringify({
                  type: 'change',
                  operation: change.operationType,
                  collection: config.collectionName,
                  documentId: change.documentKey?._id,
                  timestamp: new Date().toISOString(),
                })}\\n\\n\`)
              );
            }
          },
          filter
        );

        // 6. Keep-alive ping every 30s
        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(': keep-alive\\n\\n'));
        }, 30000);

        // 7. Cleanup on disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(keepAlive);
          stopChangeStream(streamId);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  };
}
```

---

## Real-World Examples

### Example 1: Manager Stores SSE

**Problem:** Manager needs to see real-time updates for assigned stores only.

**Solution:**

```typescript
// app/api/manager/stores/sse/route.ts
import Store from '@/lib/models/Store';
import StoreAssignManager from '@/lib/models/StoreAssignManager';
import { createSSEHandler } from '@/lib/utils/sseFactory';

export const GET = createSSEHandler({
  model: Store,
  collectionName: 'stores',
  getUserFilter: async (userId: string) => {
    // Get assigned store IDs
    const assignments = await StoreAssignManager.find({
      managerUserId: userId,
    }).select('storeId');

    const storeIds = assignments.map(a => a.storeId.toString());

    return {
      'fullDocument._id': { $in: storeIds },
      'fullDocument.isActive': true,
    };
  },
  requireAuth: true,
  checkUserType: 'manager',
});
```

### Example 2: Brand/Vendor Work Authority SSE

**Problem:** Brand and vendor need different SSE streams but same logic.

**Solution:**

```typescript
// app/api/brand/work-authority/sse/route.ts
export const GET = createSSEHandler({
  model: WorkAuthority,
  collectionName: 'workauthorities',
  getUserFilter: (userId: string) => ({
    $or: [
      { 'fullDocument.createdId': userId },
      { 'fullDocument.parentId': userId },
    ],
    'fullDocument.isActive': true,
  }),
  requireAuth: true,
  checkUserType: 'brand',
});

// app/api/vendor/work-authority/sse/route.ts
export const GET = createSSEHandler({
  model: WorkAuthority,
  collectionName: 'workauthorities',
  getUserFilter: (userId: string) => ({
    $or: [
      { 'fullDocument.createdId': userId },
      { 'fullDocument.parentId': userId },
    ],
    'fullDocument.isActive': true,
  }),
  requireAuth: true,
  checkUserType: 'vendor',
});
```

### Example 3: New Element Requests (Multi-Collection)

**Problem:** Admin needs updates from both BrandRate and VendorRate collections.

**Solution:**

```typescript
import { createMultiCollectionSSEHandler } from '@/lib/utils/sseFactory';

export const GET = createMultiCollectionSSEHandler({
  collections: [
    {
      model: BrandRate,
      collectionName: 'brandrates',
      filter: {
        'fullDocument.newElement': true,
        'fullDocument.rateRejected': { $ne: true },
      },
    },
    {
      model: VendorRate,
      collectionName: 'vendorrates',
      filter: {
        'fullDocument.newElement': true,
        'fullDocument.rateRejected': { $ne: true },
      },
    },
  ],
  requireAuth: true,
  checkUserType: 'admin',
});
```

---

## Multi-Collection SSE

For watching multiple collections simultaneously:

```typescript
export function createMultiCollectionSSEHandler(config: {
  collections: {
    model: Model<any>;
    collectionName: string;
    filter?: object;
  }[];
  requireAuth?: boolean;
  checkUserType?: string | string[];
}) {
  return async function GET(req: NextRequest) {
    // ... auth logic ...

    const stream = new ReadableStream({
      async start(controller) {
        const streamIds: string[] = [];

        // Watch each collection
        for (const { model, collectionName, filter } of config.collections) {
          const streamId = \`\${collectionName}-\${userId}-\${Date.now()}\`;
          streamIds.push(streamId);

          const pipeline = filter ? [{ $match: filter }] : [];

          startChangeStream(
            model.collection,
            streamId,
            (change) => {
              controller.enqueue(
                encoder.encode(\`data: \${JSON.stringify({
                  type: 'change',
                  collection: collectionName,
                  operation: change.operationType,
                })}\\n\\n\`)
              );
            },
            pipeline
          );
        }

        // Cleanup all streams
        req.signal.addEventListener('abort', () => {
          streamIds.forEach(id => stopChangeStream(id));
        });
      },
    });

    return new Response(stream, { /* headers */ });
  };
}
```

---

## Client-Side Integration

### useSSE Hook

**File:** `lib/hooks/useSSE.ts`

```typescript
import { useEffect, useState, useRef } from 'react';

interface UseSSEOptions {
  enabled?: boolean;
  onMessage?: (message: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
}

export function useSSE(url: string | null, options: UseSSEOptions = {}) {
  const { enabled = true, onMessage, onError, onOpen } = options;
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url || !enabled) {
      return;
    }

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      setIsConnected(false);
      onError?.(error);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [url, enabled]);

  return { isConnected, eventSource: eventSourceRef.current };
}
```

### Usage Pattern

```typescript
const { data, mutate } = useSWR('/api/data');
const { isConnected } = useSSE('/api/data/sse?token=xxx', {
  onMessage: (msg) => {
    if (msg.type === 'change') mutate();
  },
});
```

---

## Best Practices

### 1. Authentication

✅ **DO:**
```typescript
// Pass token in URL for SSE (EventSource doesn't support headers)
\`/api/sse?token=\${accessToken}\`

// Verify on server
const token = req.nextUrl.searchParams.get('token');
const decoded = verifyAccessToken(token);
```

❌ **DON'T:**
```typescript
// EventSource doesn't support custom headers
new EventSource(url, { headers: { Authorization: 'Bearer xxx' } }); // Won't work
```

### 2. Keep-Alive

✅ **DO:**
```typescript
// Send periodic pings
setInterval(() => {
  controller.enqueue(encoder.encode(': keep-alive\\n\\n'));
}, 30000);
```

### 3. Cleanup

✅ **DO:**
```typescript
// Always cleanup on disconnect
req.signal.addEventListener('abort', () => {
  clearInterval(keepAlive);
  stopChangeStream(streamId);
  controller.close();
});
```

### 4. Error Handling

✅ **DO:**
```typescript
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // EventSource auto-reconnects, no manual intervention needed
};
```

### 5. Performance

✅ **DO:**
```typescript
// Use filters to reduce events
getUserFilter: (userId) => ({
  'fullDocument.createdId': userId, // Only user's docs
  'fullDocument.isActive': true,    // Only active docs
})
```

❌ **DON'T:**
```typescript
// Watch entire collection without filters
getUserFilter: () => ({}) // Bad: sends all changes
```

---

## Debugging

### Server-Side Debugging

```typescript
export const GET = createSSEHandler({
  model: YourModel,
  collectionName: 'yourmodels',
  getUserFilter: (userId: string) => {
    console.log('SSE: User connected:', userId);
    const filter = {
      'fullDocument.createdId': userId,
    };
    console.log('SSE: Filter:', JSON.stringify(filter));
    return filter;
  },
  requireAuth: true,
});
```

Add logging in `sseFactory.ts`:

```typescript
startChangeStream(collection, streamId, (change) => {
  console.log('SSE: Change detected:', {
    type: change.operationType,
    collection: collectionName,
    documentId: change.documentKey?._id,
  });
  
  controller.enqueue(/* ... */);
}, filter);
```

### Client-Side Debugging

```typescript
const { isConnected } = useSSE(sseUrl, {
  onOpen: () => console.log('SSE: Connected'),
  onMessage: (msg) => console.log('SSE: Message:', msg),
  onError: (err) => console.error('SSE: Error:', err),
});

console.log('SSE: Connection status:', isConnected);
```

### Network Tab

1. Open DevTools → Network
2. Filter by "EventSource" or "sse"
3. Check request headers (should have token)
4. See messages in real-time
5. Verify keep-alive pings

---

## Common Issues

### Issue 1: SSE Not Connecting

**Symptoms:**
- `isConnected` always false
- No messages received

**Solutions:**

1. **Check Token:**
   ```typescript
   const sseUrl = accessToken 
     ? \`/api/sse?token=\${accessToken}\` 
     : null;
   ```

2. **Verify MongoDB Change Streams Enabled:**
   ```
   MongoDB must be replica set for change streams
   ```

3. **Check CORS:**
   ```typescript
   headers: {
     'Access-Control-Allow-Origin': '*', // If needed
   }
   ```

### Issue 2: SSE Connects But No Updates

**Symptoms:**
- Connection established
- No events on data changes

**Solutions:**

1. **Check Filter:**
   ```typescript
   // Too restrictive?
   getUserFilter: (userId) => {
     console.log('Watching for userId:', userId);
     return { 'fullDocument.createdId': userId };
   }
   ```

2. **Verify Change Stream:**
   ```typescript
   // In MongoDB shell
   db.collection.watch()
   ```

3. **Check Collection Name:**
   ```typescript
   collectionName: 'stores', // Must match MongoDB collection
   ```

### Issue 3: Multiple Connections

**Symptoms:**
- Multiple SSE connections for same user
- Memory leaks

**Solutions:**

1. **Proper Cleanup:**
   ```typescript
   useEffect(() => {
     const eventSource = new EventSource(url);
     
     return () => {
       eventSource.close(); // Always cleanup
     };
   }, [url]);
   ```

2. **Conditional Connect:**
   ```typescript
   const { isConnected } = useSSE(
     accessToken ? sseUrl : null, // Don't connect without token
     { enabled: !!accessToken }
   );
   ```

### Issue 4: SSE Stops After Timeout

**Symptoms:**
- Connection drops after 60 seconds
- No auto-reconnect

**Solutions:**

1. **Add Keep-Alive:**
   ```typescript
   setInterval(() => {
     controller.enqueue(encoder.encode(': keep-alive\\n\\n'));
   }, 30000); // Every 30s
   ```

2. **Check Proxy/Load Balancer:**
   ```
   Some proxies close idle connections
   Configure timeout to > keep-alive interval
   ```

---

## Performance Considerations

### 1. Connection Limits

- **Browser Limit:** ~6 concurrent SSE per domain
- **Solution:** Use single SSE with multiple filters

### 2. Memory Usage

- **Problem:** Change streams consume memory
- **Solution:** Implement connection pooling

### 3. Scaling

- **Problem:** Each connection holds server resources
- **Solution:** 
  - Use Redis for pub/sub across instances
  - Implement connection limits per user
  - Use sticky sessions

### 4. Bandwidth

- **Problem:** High-frequency updates consume bandwidth
- **Solution:**
  - Debounce events
  - Send only changed fields
  - Compress messages

---

## Summary

### When to Use SSE:
✅ Live dashboards  
✅ Real-time notifications  
✅ Activity feeds  
✅ Stock tickers  
✅ Monitoring systems  

### When NOT to Use SSE:
❌ Bidirectional communication (use WebSocket)  
❌ Binary data transfer (use WebSocket)  
❌ Gaming (use WebSocket)  
❌ Simple occasional updates (use polling)  

### Key Takeaways:
1. SSE is perfect for **server → client** real-time updates
2. Use **MongoDB Change Streams** for database watching
3. Always implement **keep-alive** pings
4. Pass **token in URL** for authentication
5. Use **SWR + SSE** for optimal data fetching
6. **Cleanup** connections on component unmount
7. Use **factory pattern** for reusable SSE endpoints
8. Monitor **connection status** with live indicator

---

## Complete Implementation Checklist

- [ ] Create SSE endpoint (`/api/resource/sse/route.ts`)
- [ ] Use `createSSEHandler()` factory
- [ ] Define `getUserFilter()` for access control
- [ ] Set `requireAuth: true`
- [ ] Optionally check `userType`
- [ ] Create custom hook (`useYourResource.ts`)
- [ ] Integrate `useSSE()` hook
- [ ] Setup `mutate()` on message
- [ ] Add live indicator in UI
- [ ] Test real-time updates
- [ ] Verify cleanup on unmount
- [ ] Check keep-alive pings
- [ ] Monitor connection status
- [ ] Handle errors gracefully
- [ ] Document usage

---

**Happy real-time coding! 🚀**
