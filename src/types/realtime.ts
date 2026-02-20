/**
 * Real-Time Event Type Definitions
 * All events follow a consistent structure for type safety
 */

export type RealtimeEventType =
  // Transaction events
  | 'transaction:created'
  | 'transaction:updated'
  | 'transaction:deleted'
  // Category events
  | 'category:created'
  | 'category:updated'
  | 'category:deleted'
  // Dashboard events
  | 'dashboard:invalidate'
  // Bank sync events
  | 'bank:sync:start'
  | 'bank:sync:progress'
  | 'bank:sync:complete'
  // User presence events
  | 'user:connected'
  | 'user:disconnected'
  // Fixed costs events
  | 'fixed-cost:created'
  | 'fixed-cost:updated'
  | 'fixed-cost:deleted';

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  data: T;
  timestamp: string; // ISO8601
  userId: string;
}

// Transaction Events
export interface TransactionData {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  categoryId?: string;
  recipient?: string;
  source: 'bank_sync' | 'manual' | 'csv_import';
}

export interface TransactionCreatedEvent
  extends RealtimeEvent<TransactionData> {
  type: 'transaction:created';
}

export interface TransactionUpdatedEvent
  extends RealtimeEvent<{ id: string; changes: Partial<TransactionData> }> {
  type: 'transaction:updated';
}

export interface TransactionDeletedEvent
  extends RealtimeEvent<{ id: string }> {
  type: 'transaction:deleted';
}

// Category Events
export interface CategoryData {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income';
}

export interface CategoryCreatedEvent extends RealtimeEvent<CategoryData> {
  type: 'category:created';
}

export interface CategoryUpdatedEvent
  extends RealtimeEvent<{ id: string; changes: Partial<CategoryData> }> {
  type: 'category:updated';
}

export interface CategoryDeletedEvent extends RealtimeEvent<{ id: string }> {
  type: 'category:deleted';
}

// Dashboard Events
export interface DashboardInvalidateEvent
  extends RealtimeEvent<{ keys: string[] }> {
  type: 'dashboard:invalidate';
}

// Bank Sync Events
export interface BankSyncStartEvent
  extends RealtimeEvent<{
    status: 'syncing';
  }> {
  type: 'bank:sync:start';
}

export interface BankSyncProgressEvent
  extends RealtimeEvent<{
    status: 'syncing';
    imported: number;
    duplicates: number;
  }> {
  type: 'bank:sync:progress';
}

export interface BankSyncCompleteEvent
  extends RealtimeEvent<{
    status: 'complete';
    imported: number;
    duplicates: number;
  }> {
  type: 'bank:sync:complete';
}

// User Presence Events
export interface UserConnectedEvent
  extends RealtimeEvent<{ userId: string; tabs: number }> {
  type: 'user:connected';
}

export interface UserDisconnectedEvent
  extends RealtimeEvent<{ userId: string }> {
  type: 'user:disconnected';
}

// Fixed Cost Events
export interface FixedCostData {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  recurrence: 'monthly' | 'annual' | 'quarterly';
  subcategory?: string;
  notes?: string;
}

export interface FixedCostCreatedEvent extends RealtimeEvent<FixedCostData> {
  type: 'fixed-cost:created';
}

export interface FixedCostUpdatedEvent
  extends RealtimeEvent<{ id: string; changes: Partial<FixedCostData> }> {
  type: 'fixed-cost:updated';
}

export interface FixedCostDeletedEvent extends RealtimeEvent<{ id: string }> {
  type: 'fixed-cost:deleted';
}

// Union type for all events
export type AnyRealtimeEvent =
  | TransactionCreatedEvent
  | TransactionUpdatedEvent
  | TransactionDeletedEvent
  | CategoryCreatedEvent
  | CategoryUpdatedEvent
  | CategoryDeletedEvent
  | DashboardInvalidateEvent
  | BankSyncStartEvent
  | BankSyncProgressEvent
  | BankSyncCompleteEvent
  | UserConnectedEvent
  | UserDisconnectedEvent
  | FixedCostCreatedEvent
  | FixedCostUpdatedEvent
  | FixedCostDeletedEvent;

// WebSocket message wrapper
export interface WebSocketMessage {
  id?: string; // For request-response pairs
  type: 'subscribe' | 'unsubscribe' | 'message' | 'heartbeat';
  channel?: string;
  payload?: unknown;
  timestamp: string;
}
