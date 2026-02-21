'use client';

import { useEffect, useState } from 'react';
import { useRealtimeStore } from '@/store/realtime';
import { CheckCircle, Loader } from 'lucide-react';

/**
 * Bank Sync Progress Component
 * Shows real-time progress during bank synchronization
 */
export function SyncProgress() {
  const bankSyncProgress = useRealtimeStore((state) => state.bankSyncProgress);
  const [hideComplete, setHideComplete] = useState(false);

  // Hide completion message after 3 seconds
  useEffect(() => {
    if (bankSyncProgress.status === 'complete' && !hideComplete) {
      const timeout = setTimeout(() => {
        setHideComplete(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }
    if (bankSyncProgress.status === 'syncing') {
      setHideComplete(false);
    }
  }, [bankSyncProgress.status, hideComplete]);

  const isVisible = bankSyncProgress.status === 'syncing' || (bankSyncProgress.status === 'complete' && !hideComplete);
  if (!isVisible) return null;

  const { status, imported, duplicates } = bankSyncProgress;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex items-center gap-3">
        {status === 'syncing' && (
          <Loader className="w-5 h-5 text-blue-500 animate-spin" />
        )}
        {status === 'complete' && (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}

        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {status === 'syncing' ? 'Sincronizando banco...' : 'Sincronização concluída'}
          </h4>

          <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Transações importadas:</span>
              <strong>{imported}</strong>
            </div>
            {duplicates > 0 && (
              <div className="flex justify-between">
                <span>Duplicatas removidas:</span>
                <strong>{duplicates}</strong>
              </div>
            )}
          </div>

          {status === 'syncing' && (
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((imported / Math.max(imported + duplicates, 1)) * 100, 95)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
