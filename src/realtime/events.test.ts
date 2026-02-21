import { describe, it, expect } from 'vitest';
import {
  TransactionCreatedEvent,
  CategoryCreatedEvent,
  BankSyncStartEvent,
  BankSyncCompleteEvent,
} from '@/types/realtime';

describe('Real-Time Events', () => {
  describe('Event Structure', () => {
    it('should create valid transaction:created event', () => {
      const event: TransactionCreatedEvent = {
        type: 'transaction:created',
        data: {
          id: '123',
          date: new Date().toISOString(),
          description: 'Test transaction',
          amount: 100,
          type: 'pix_sent',
          categoryId: 'cat-1',
          recipient: 'John Doe',
          source: 'manual',
        },
        timestamp: new Date().toISOString(),
        userId: 'user-1',
      };

      expect(event.type).toBe('transaction:created');
      expect(event.data.id).toBe('123');
      expect(event.timestamp).toBeDefined();
      expect(event.userId).toBe('user-1');
    });

    it('should create valid category:created event', () => {
      const event: CategoryCreatedEvent = {
        type: 'category:created',
        data: {
          id: 'cat-1',
          name: 'Groceries',
          color: '#FF5733',
          icon: 'shopping-bag',
          type: 'expense',
        },
        timestamp: new Date().toISOString(),
        userId: 'user-1',
      };

      expect(event.type).toBe('category:created');
      expect(event.data.name).toBe('Groceries');
    });

    it('should create valid bank:sync:start event', () => {
      const event: BankSyncStartEvent = {
        type: 'bank:sync:start',
        data: { status: 'syncing' },
        timestamp: new Date().toISOString(),
        userId: 'user-1',
      };

      expect(event.type).toBe('bank:sync:start');
      expect(event.data.status).toBe('syncing');
    });

    it('should create valid bank:sync:complete event', () => {
      const event: BankSyncCompleteEvent = {
        type: 'bank:sync:complete',
        data: {
          status: 'complete',
          imported: 42,
          duplicates: 3,
        },
        timestamp: new Date().toISOString(),
        userId: 'user-1',
      };

      expect(event.type).toBe('bank:sync:complete');
      expect(event.data.imported).toBe(42);
      expect(event.data.duplicates).toBe(3);
    });
  });
});
