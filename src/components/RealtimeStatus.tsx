'use client';

import { useEffect } from 'react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useRealtimeStore } from '@/store/realtime';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Real-Time Connection Status Indicator
 * Shows WebSocket connection status and syncing state
 */
export function RealtimeStatus() {
  const { isConnected, subscribe } = useRealtimeSync({
    enabled: true,
    channels: [],
    onEvent: (event) => {
      const store = useRealtimeStore.getState();
      store.handleEvent(event);
    },
  });

  const syncInProgress = useRealtimeStore((state) => state.syncInProgress);

  // Subscribe to main channels on mount
  useEffect(() => {
    subscribe('dashboard:*');
    subscribe('transactions:*');
    subscribe('categories:*');
  }, [subscribe]);

  return (
    <div className="flex items-center gap-2 text-sm">
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {syncInProgress ? 'Sincronizando...' : 'Conectado'}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Desconectado
          </span>
        </>
      )}
    </div>
  );
}
