'use client';

import { create } from 'zustand';
import {
  AnyRealtimeEvent,
  TransactionData,
  CategoryData,
  FixedCostData,
} from '@/types/realtime';

interface RealtimeState {
  // Connection state
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  // Events queue (for processing later)
  eventQueue: AnyRealtimeEvent[];
  addEvent: (event: AnyRealtimeEvent) => void;
  clearEvents: () => void;

  // Cache invalidation
  invalidatedKeys: Set<string>;
  invalidateKeys: (keys: string[]) => void;
  clearInvalidation: (key: string) => void;

  // Sync status
  syncInProgress: boolean;
  setSyncInProgress: (inProgress: boolean) => void;

  // Bank sync progress
  bankSyncProgress: {
    status: 'idle' | 'syncing' | 'complete';
    imported: number;
    duplicates: number;
  };
  setBankSyncStatus: (
    status: 'idle' | 'syncing' | 'complete',
    imported?: number,
    duplicates?: number
  ) => void;

  // Handle incoming events
  handleEvent: (event: AnyRealtimeEvent) => void;

  // Reset state
  reset: () => void;
}

const initialBankSyncProgress = {
  status: 'idle' as const,
  imported: 0,
  duplicates: 0,
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  // Connection state
  isConnected: false,
  setIsConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  // Events queue
  eventQueue: [],
  addEvent: (event: AnyRealtimeEvent) => {
    set((state) => ({
      eventQueue: [...state.eventQueue, event],
    }));
  },
  clearEvents: () => {
    set({ eventQueue: [] });
  },

  // Cache invalidation
  invalidatedKeys: new Set<string>(),
  invalidateKeys: (keys: string[]) => {
    set((state) => {
      const newKeys = new Set(state.invalidatedKeys);
      keys.forEach((key) => newKeys.add(key));
      return { invalidatedKeys: newKeys };
    });
  },
  clearInvalidation: (key: string) => {
    set((state) => {
      const newKeys = new Set(state.invalidatedKeys);
      newKeys.delete(key);
      return { invalidatedKeys: newKeys };
    });
  },

  // Sync status
  syncInProgress: false,
  setSyncInProgress: (inProgress: boolean) => {
    set({ syncInProgress: inProgress });
  },

  // Bank sync progress
  bankSyncProgress: initialBankSyncProgress,
  setBankSyncStatus: (
    status: 'idle' | 'syncing' | 'complete',
    imported?: number,
    duplicates?: number
  ) => {
    set({
      bankSyncProgress: {
        status,
        imported: imported ?? 0,
        duplicates: duplicates ?? 0,
      },
    });
  },

  // Handle incoming events
  handleEvent: (event: AnyRealtimeEvent) => {
    set((state) => {
      const newState = { ...state };

      switch (event.type) {
        case 'transaction:created':
        case 'transaction:updated':
        case 'transaction:deleted':
          newState.invalidatedKeys.add('transactions');
          newState.invalidatedKeys.add('dashboard');
          break;

        case 'category:created':
        case 'category:updated':
        case 'category:deleted':
          newState.invalidatedKeys.add('categories');
          newState.invalidatedKeys.add('dashboard');
          break;

        case 'fixed-cost:created':
        case 'fixed-cost:updated':
        case 'fixed-cost:deleted':
          newState.invalidatedKeys.add('fixed-costs');
          newState.invalidatedKeys.add('dashboard');
          break;

        case 'dashboard:invalidate':
          const data = event.data as { keys: string[] };
          data.keys.forEach((key) => newState.invalidatedKeys.add(key));
          break;

        case 'bank:sync:start':
          newState.bankSyncProgress = {
            status: 'syncing',
            imported: 0,
            duplicates: 0,
          };
          newState.syncInProgress = true;
          break;

        case 'bank:sync:progress':
          const progressData = event.data as {
            status: string;
            imported: number;
            duplicates: number;
          };
          newState.bankSyncProgress = {
            status: 'syncing',
            imported: progressData.imported,
            duplicates: progressData.duplicates,
          };
          break;

        case 'bank:sync:complete':
          const completeData = event.data as {
            status: string;
            imported: number;
            duplicates: number;
          };
          newState.bankSyncProgress = {
            status: 'complete',
            imported: completeData.imported,
            duplicates: completeData.duplicates,
          };
          newState.syncInProgress = false;
          newState.invalidatedKeys.add('dashboard');
          newState.invalidatedKeys.add('transactions');
          break;
      }

      return newState;
    });
  },

  // Reset state
  reset: () => {
    set({
      isConnected: false,
      eventQueue: [],
      invalidatedKeys: new Set(),
      syncInProgress: false,
      bankSyncProgress: initialBankSyncProgress,
    });
  },
}));
