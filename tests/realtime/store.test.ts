import { describe, it, expect, beforeEach } from 'vitest';
import { useRealtimeStore } from '@/store/realtime';

describe('Realtime Store', () => {
  beforeEach(() => {
    const store = useRealtimeStore.getState();
    store.reset();
  });

  describe('Connection State', () => {
    it('should initialize with disconnected state', () => {
      const state = useRealtimeStore.getState();
      expect(state.isConnected).toBe(false);
    });

    it('should update connection state', () => {
      const store = useRealtimeStore.getState();
      store.setIsConnected(true);

      const state = useRealtimeStore.getState();
      expect(state.isConnected).toBe(true);

      store.setIsConnected(false);
      expect(useRealtimeStore.getState().isConnected).toBe(false);
    });
  });

  describe('Event Queue', () => {
    it('should queue events', () => {
      const store = useRealtimeStore.getState();
      const event = {
        type: 'transaction:created' as const,
        data: {
          id: '1',
          date: new Date().toISOString(),
          description: 'test',
          amount: 100,
          type: 'pix_sent',
          source: 'manual' as const,
        },
        timestamp: new Date().toISOString(),
        userId: 'user-1',
      };

      store.addEvent(event);

      const state = useRealtimeStore.getState();
      expect(state.eventQueue).toHaveLength(1);
      expect(state.eventQueue[0].type).toBe('transaction:created');
    });

    it('should clear event queue', () => {
      const store = useRealtimeStore.getState();
      store.addEvent({
        type: 'transaction:created' as const,
        data: {
          id: '1',
          date: new Date().toISOString(),
          description: 'test',
          amount: 100,
          type: 'pix_sent',
          source: 'manual' as const,
        },
        timestamp: new Date().toISOString(),
        userId: 'user-1',
      });

      store.clearEvents();

      const state = useRealtimeStore.getState();
      expect(state.eventQueue).toHaveLength(0);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate keys', () => {
      const store = useRealtimeStore.getState();
      store.invalidateKeys(['transactions', 'dashboard']);

      const state = useRealtimeStore.getState();
      expect(state.invalidatedKeys.has('transactions')).toBe(true);
      expect(state.invalidatedKeys.has('dashboard')).toBe(true);
    });

    it('should clear invalidation for specific key', () => {
      const store = useRealtimeStore.getState();
      store.invalidateKeys(['transactions', 'dashboard']);
      store.clearInvalidation('transactions');

      const state = useRealtimeStore.getState();
      expect(state.invalidatedKeys.has('transactions')).toBe(false);
      expect(state.invalidatedKeys.has('dashboard')).toBe(true);
    });
  });

  describe('Bank Sync Progress', () => {
    it('should initialize with idle status', () => {
      const state = useRealtimeStore.getState();
      expect(state.bankSyncProgress.status).toBe('idle');
      expect(state.bankSyncProgress.imported).toBe(0);
      expect(state.bankSyncProgress.duplicates).toBe(0);
    });

    it('should update sync status', () => {
      const store = useRealtimeStore.getState();
      store.setBankSyncStatus('syncing');

      const state = useRealtimeStore.getState();
      expect(state.bankSyncProgress.status).toBe('syncing');
    });

    it('should update sync progress', () => {
      const store = useRealtimeStore.getState();
      store.setBankSyncStatus('syncing', 42, 3);

      const state = useRealtimeStore.getState();
      expect(state.bankSyncProgress.status).toBe('syncing');
      expect(state.bankSyncProgress.imported).toBe(42);
      expect(state.bankSyncProgress.duplicates).toBe(3);
    });
  });

  describe('Event Handling', () => {
    it('should handle transaction:created event', () => {
      const store = useRealtimeStore.getState();
      store.handleEvent({
        type: 'transaction:created' as const,
        data: {
          id: '1',
          date: new Date().toISOString(),
          description: 'test',
          amount: 100,
          type: 'pix_sent',
          source: 'manual' as const,
        },
        timestamp: new Date().toISOString(),
        userId: 'user-1',
      });

      const state = useRealtimeStore.getState();
      expect(state.invalidatedKeys.has('transactions')).toBe(true);
      expect(state.invalidatedKeys.has('dashboard')).toBe(true);
    });

    it('should handle bank:sync:start event', () => {
      const store = useRealtimeStore.getState();
      store.handleEvent({
        type: 'bank:sync:start' as const,
        data: { status: 'syncing' },
        timestamp: new Date().toISOString(),
        userId: 'user-1',
      });

      const state = useRealtimeStore.getState();
      expect(state.syncInProgress).toBe(true);
      expect(state.bankSyncProgress.status).toBe('syncing');
    });

    it('should handle bank:sync:complete event', () => {
      const store = useRealtimeStore.getState();
      store.handleEvent({
        type: 'bank:sync:complete' as const,
        data: { status: 'complete', imported: 42, duplicates: 3 },
        timestamp: new Date().toISOString(),
        userId: 'user-1',
      });

      const state = useRealtimeStore.getState();
      expect(state.syncInProgress).toBe(false);
      expect(state.bankSyncProgress.status).toBe('complete');
      expect(state.bankSyncProgress.imported).toBe(42);
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const store = useRealtimeStore.getState();
      store.setIsConnected(true);
      store.invalidateKeys(['transactions']);
      store.setBankSyncStatus('syncing', 10, 2);

      store.reset();

      const state = useRealtimeStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.invalidatedKeys.size).toBe(0);
      expect(state.bankSyncProgress.status).toBe('idle');
    });
  });
});
