# 🔄 Semana 7: Real-Time Updates Architecture

**Status:** Planning | **Date:** 2026-02-20 | **Target:** Production-Ready WebSocket Sync

---

## Executive Summary

Findash will implement a **publish-subscribe real-time system** using WebSockets + Redis Pub/Sub, enabling:

1. **Automatic sync across browser tabs/windows** - Changes reflect instantly
2. **Multi-device sync** - Updates on mobile reflect on desktop
3. **Instant transaction notifications** - New bank transactions appear without refresh
4. **Collaborative awareness** - See when other users are viewing data
5. **Fallback polling** - Graceful degradation if WebSocket unavailable

**Architecture:** Next.js WebSocket Handler → Redis Pub/Sub → Connected Clients

---

## 1. Real-Time Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FINDASH REAL-TIME SYSTEM                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Browser Tab 1   │         │  Browser Tab 2   │
│  (Dashboard)     │         │  (Transactions)  │
└────────┬─────────┘         └────────┬─────────┘
         │                           │
         │ WebSocket                 │ WebSocket
         │ (Port 3001)               │ (Port 3001)
         │                           │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
         │  Next.js WebSocket Server │
         │  (/pages/api/ws.ts)       │
         │  - Authenticate clients   │
         │  - Route events           │
         │  - Publish to Redis       │
         └─────────────┬─────────────┘
                       │
                       │ Redis Pub/Sub
                       │
         ┌─────────────▼─────────────┐
         │   Redis Pub/Sub Hub       │
         │   - transactions:* events │
         │   - categories:* events   │
         │   - dashboard:* events    │
         │   - user:*:sync events    │
         └───────────────────────────┘
```

---

## 2. Event Types & Channels

### Transaction Events
```typescript
// Channel: transactions:{userId}
interface TransactionCreatedEvent {
  type: 'transaction:created';
  data: Transaction;
  timestamp: ISO8601;
  source: 'bank_sync' | 'manual' | 'csv_import';
}

interface TransactionUpdatedEvent {
  type: 'transaction:updated';
  data: { id: string; changes: Partial<Transaction> };
  timestamp: ISO8601;
}

interface TransactionDeletedEvent {
  type: 'transaction:deleted';
  data: { id: string };
  timestamp: ISO8601;
}
```

### Category Events
```typescript
// Channel: categories:{userId}
interface CategoryCreatedEvent {
  type: 'category:created';
  data: Category;
  timestamp: ISO8601;
}

interface CategoryUpdatedEvent {
  type: 'category:updated';
  data: { id: string; changes: Partial<Category> };
  timestamp: ISO8601;
}
```

### Dashboard Events
```typescript
// Channel: dashboard:{userId}
interface DashboardSyncEvent {
  type: 'dashboard:invalidate';
  data: { keys: string[] }; // Keys that need refresh
  timestamp: ISO8601;
}

interface BankSyncEvent {
  type: 'bank:sync:start' | 'bank:sync:progress' | 'bank:sync:complete';
  data: {
    status: 'syncing' | 'complete';
    imported?: number;
    duplicates?: number;
  };
  timestamp: ISO8601;
}
```

### User Presence Events
```typescript
// Channel: presence:{userId}
interface UserConnectedEvent {
  type: 'user:connected';
  data: { userId: string; tabs: number };
  timestamp: ISO8601;
}

interface UserDisconnectedEvent {
  type: 'user:disconnected';
  data: { userId: string };
  timestamp: ISO8601;
}
```

---

## 3. Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **WebSocket Server** | Next.js API Routes + `ws` library | Built-in, zero external server |
| **Message Broker** | Redis Pub/Sub | Already in Upstash, scalable |
| **Client Library** | Custom hooks + Zustand | Lightweight, type-safe |
| **Authentication** | NextAuth JWT in WebSocket headers | Secure, aligned with existing auth |
| **Fallback** | Polling every 5-30s | Graceful degradation |
| **Persistence** | Redis (optional) | For offline sync when online |

---

## 4. Implementation Architecture

### 4.1 Backend: WebSocket Server (`src/lib/websocket.ts`)

```typescript
// WebSocket connection manager
export class WebSocketServer {
  private connections: Map<string, WebSocket[]> = new Map();
  private redisClient: Redis;

  constructor(redisUrl: string) {
    this.redisClient = new Redis(redisUrl);
    this.subscribeToChannels();
  }

  // Handle new WebSocket connections
  async handleConnection(socket: WebSocket, userId: string) {
    const connections = this.connections.get(userId) || [];
    connections.push(socket);
    this.connections.set(userId, connections);

    // Subscribe to user's channels
    await this.subscribeToUserChannels(userId);
  }

  // Publish event to Redis (other instances pick it up)
  async publishEvent(channel: string, event: RealtimeEvent) {
    await this.redisClient.publish(channel, JSON.stringify(event));
  }

  // Send event to connected clients
  private broadcastToUser(userId: string, event: RealtimeEvent) {
    const connections = this.connections.get(userId);
    connections?.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(event));
      }
    });
  }
}
```

### 4.2 API Route (`src/app/api/ws/route.ts`)

```typescript
import { WebSocketServer } from '@/lib/websocket';

const wsServer = new WebSocketServer(process.env.REDIS_URL!);

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const userId = await verifyToken(token);

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Upgrade to WebSocket
  const socket = new WebSocket(req.url, {
    protocol: ['chat', 'superchat']
  });

  await wsServer.handleConnection(socket, userId);

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleClientMessage(userId, message);
  };

  socket.onclose = () => {
    wsServer.handleDisconnection(userId, socket);
  };
}
```

### 4.3 Client Hook (`src/hooks/useRealtimeSync.ts`)

```typescript
export function useRealtimeSync() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const token = getSessionToken();
      const wsUrl = `ws://${window.location.host}/api/ws`;

      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onopen = () => setIsConnected(true);
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealtimeEvent(data);
      };
      wsRef.current.onclose = () => {
        setIsConnected(false);
        // Retry after 3s
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { isConnected, send: (msg) => wsRef.current?.send(JSON.stringify(msg)) };
}
```

---

## 5. Data Flow Examples

### Example 1: Transaction Created Locally

```
1. User creates transaction in UI
   ↓
2. API POST /api/transactions → DB + Cache invalidated
   ↓
3. Server publishes: redis.publish('transactions:userId', { type: 'transaction:created' })
   ↓
4. WebSocket server receives from Redis
   ↓
5. WebSocket broadcasts to all connected clients of userId
   ↓
6. Client receives event → Zustand store updates
   ↓
7. React re-renders with new transaction
```

### Example 2: Bank Sync Started

```
1. /api/inter/sync endpoint begins syncing
   ↓
2. Server publishes: redis.publish('dashboard:userId', { type: 'bank:sync:start' })
   ↓
3. WebSocket clients receive event
   ↓
4. UI shows "Syncing..." spinner
   ↓
5. As transactions imported: redis.publish('dashboard:userId', { type: 'bank:sync:progress' })
   ↓
6. Progress bar updates
   ↓
7. Sync complete: redis.publish('dashboard:userId', { type: 'bank:sync:complete' })
   ↓
8. Dashboard automatically refreshed (no user action needed)
```

### Example 3: Multi-Tab Sync

```
Tab 1 (Dashboard)          Tab 2 (Transactions)
     │                              │
     │ Creates category             │
     ├─→ POST /api/categories       │
     │        ├→ DB save            │
     │        └→ redis.publish()    │
     │                   ↓          │
     │              WebSocket server receives
     │                   ↓          │
     │      Broadcasts to all tabs of user
     │                   ↓          │
     ├─ Receives event ←│← Receives event
     │                   │
     ├─ Updates Zustand store
     │                   │
     └─ Re-renders ←──────→ Re-renders
```

---

## 6. Implementation Plan (Tasks)

### Task 1: WebSocket Server Setup
- Create `src/lib/websocket-server.ts` (WebSocket connection manager)
- Create `src/lib/redis-pubsub.ts` (Redis subscription manager)
- Setup authentication middleware
- Create event type definitions

**Files:**
- `src/lib/websocket-server.ts` (new)
- `src/lib/redis-pubsub.ts` (new)
- `src/types/realtime.ts` (new)

**Duration:** 2 hours

---

### Task 2: API Routes & Event Publishing
- Create `/api/ws` route for WebSocket upgrade
- Create `/api/realtime/publish` route for server-side event publishing
- Integrate event publishing into existing API routes:
  - POST /api/transactions (trigger `transaction:created`)
  - PUT /api/transactions/:id (trigger `transaction:updated`)
  - DELETE /api/transactions/:id (trigger `transaction:deleted`)
  - POST /api/categories (trigger `category:created`)
  - POST /api/inter/sync (trigger `bank:sync:*` events)

**Files Modified:**
- `src/app/api/ws/route.ts` (new)
- `src/app/api/transactions/route.ts` (modified)
- `src/app/api/transactions/[id]/route.ts` (new)
- `src/app/api/categories/route.ts` (modified)
- `src/app/api/fixed-costs/route.ts` (modified)
- `src/app/api/inter/sync/route.ts` (modified)

**Duration:** 3 hours

---

### Task 3: Client-Side Hooks
- Create `src/hooks/useRealtimeSync.ts` (WebSocket connection + reconnection)
- Create `src/hooks/useRealtimeStore.ts` (Zustand store for realtime state)
- Integrate with existing Zustand stores
- Handle offline state + fallback polling

**Files:**
- `src/hooks/useRealtimeSync.ts` (new)
- `src/hooks/useRealtimeStore.ts` (new)
- `src/store/realtime.ts` (new)

**Duration:** 2 hours

---

### Task 4: UI Components & Integration
- Create `src/components/RealtimeStatus.tsx` (connection indicator)
- Create `src/components/SyncProgress.tsx` (bank sync progress)
- Update Dashboard to use realtime hooks
- Update Transactions list to refresh in real-time
- Add toast notifications for bank sync events

**Files:**
- `src/components/RealtimeStatus.tsx` (new)
- `src/components/SyncProgress.tsx` (new)
- `src/app/(dashboard)/page.tsx` (modified)
- `src/app/(dashboard)/transacoes/page.tsx` (modified)

**Duration:** 2 hours

---

### Task 5: Testing & Optimization
- Create `tests/realtime/websocket.test.ts` (WebSocket connection tests)
- Create `tests/realtime/pubsub.test.ts` (Redis Pub/Sub tests)
- Create `tests/realtime/integration.test.ts` (end-to-end sync tests)
- Performance optimization: connection pooling, memory management
- Implement graceful degradation (fallback to polling)

**Files:**
- `tests/realtime/websocket.test.ts` (new)
- `tests/realtime/pubsub.test.ts` (new)
- `tests/realtime/integration.test.ts` (new)
- `src/lib/realtime-fallback.ts` (new - polling fallback)

**Duration:** 3 hours

---

## 7. Security Considerations

### Authentication
- ✅ Use NextAuth JWT token from header
- ✅ Verify token on WebSocket upgrade
- ✅ Reject unauthorized connections
- ✅ Invalidate token on logout

### Authorization
- ✅ Only send events for user's own data
- ✅ Filter by userId in Redis channel subscription
- ✅ Never broadcast sensitive data (passwords, tokens)
- ✅ Verify ownership before processing client commands

### Rate Limiting
- ✅ Limit WebSocket messages per user per minute
- ✅ Prevent message flooding attacks
- ✅ Track connections per IP
- ✅ Disconnect abusive clients

### Data Validation
- ✅ Validate all realtime events with Zod schemas
- ✅ Sanitize event data before broadcasting
- ✅ Log suspicious patterns
- ✅ Implement replay attack prevention

---

## 8. Performance Strategy

### Connection Management
```
Max connections per user: 5 (desktop + mobile)
Message batch size: 10 events per 100ms
Memory per connection: ~50KB (WebSocket overhead)
```

### Scalability
```
Current: Single Next.js server → Redis Pub/Sub
Future: Load-balanced servers (Redis ensures consistency)
Estimated capacity: 10,000 concurrent WebSocket connections
```

### Monitoring
```
Metrics to track:
- Active WebSocket connections
- Message latency (p50, p99)
- Connection drop rate
- Event processing rate
```

---

## 9. Fallback Strategy (Polling)

If WebSocket unavailable (corporate proxy, firewall):

```typescript
const usePollingFallback = () => {
  const [data, setData] = useState(null);
  const lastSyncRef = useRef<timestamp>(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/dashboard?since=' + lastSyncRef.current);
      const newData = await response.json();

      if (newData.changed) {
        setData(newData);
        lastSyncRef.current = Date.now();
      }
    }, isActiveTab ? 5000 : 30000); // 5s if active, 30s if inactive

    return () => clearInterval(interval);
  }, []);
};
```

---

## 10. Dependencies to Add

```json
{
  "dependencies": {
    "ws": "^8.17.0",           // WebSocket server
    "socket.io": "^4.7.0",     // Alternative: socket.io for better compatibility
    "redis": "^4.6.0"          // Redis client (already using Upstash)
  },
  "devDependencies": {
    "ws-mock": "^1.0.0"        // WebSocket mocking for tests
  }
}
```

---

## 11. Timeline

```
Semana 7: Real-Time Updates

Monday (2026-02-23):
├─ Task 1: WebSocket server setup (2h)
├─ Task 2: API routes & publishing (3h)
└─ Integration testing (1h)

Tuesday (2026-02-24):
├─ Task 3: Client-side hooks (2h)
├─ Task 4: UI components (2h)
└─ E2E testing (2h)

Wednesday (2026-02-25):
├─ Task 5: Testing & optimization (3h)
├─ Performance profiling (1h)
├─ Documentation (1h)
└─ Final integration (1h)

TOTAL: 20 hours
```

---

## 12. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| WebSocket latency | < 100ms | Message round-trip time |
| Connection reliability | 99.5% | % of connections maintained |
| Message delivery | 100% | Events not lost |
| Fallback activation | < 1s | Time to detect failure + fallback |
| Memory per connection | < 100KB | WStat memory usage |
| CPU utilization | < 50% | At 10k connections |

---

## 13. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| WebSocket not supported | High | Implement polling fallback |
| Redis unavailable | High | Queue events locally, replay when online |
| Broadcast storm | Medium | Rate limit + batch events |
| Memory leak | Medium | Monitor connection cleanup |
| Token expiry | Medium | Refresh token before expiry |

---

## Próximos Passos

1. ✅ Architecture designed
2. → @dev implementa Tasks 1-5
3. → @qa valida real-time sync
4. → @devops push para GitHub

---

*Arquitetura desenhada por @architect Aria — Synkra AIOS v4.2*
