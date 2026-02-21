'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [hideAfterOnline, setHideAfterOnline] = useState(false);

  useEffect(() => {
    if (isOnline) {
      // Show for 2 seconds when coming back online, then hide
      const timer = setTimeout(() => setHideAfterOnline(true), 2000);
      return () => clearTimeout(timer);
    } else {
      // Reset when going offline
      setHideAfterOnline(false);
    }
  }, [isOnline]);

  const showIndicator = !isOnline || !hideAfterOnline;
  if (!showIndicator) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={18} />
          <span className="text-sm font-medium">Back Online</span>
        </>
      ) : (
        <>
          <WifiOff size={18} />
          <span className="text-sm font-medium">You are offline</span>
        </>
      )}
    </div>
  );
}
