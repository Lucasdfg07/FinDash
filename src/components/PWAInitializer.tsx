'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useEffect, useState } from 'react';

export function PWAInitializer() {
  useServiceWorker(); // Register service worker on mount
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Listen for service worker update availability
    const handleSWUpdate = () => {
      setShowUpdatePrompt(true);
    };

    window.addEventListener('sw-update-available', handleSWUpdate);
    return () => window.removeEventListener('sw-update-available', handleSWUpdate);
  }, []);

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-4">
      <div>
        <p className="font-medium">Nova versão disponível</p>
        <p className="text-sm opacity-90">Recarregue para atualizar</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="bg-white text-blue-500 px-4 py-2 rounded font-medium hover:bg-blue-50"
      >
        Atualizar
      </button>
      <button
        onClick={() => setShowUpdatePrompt(false)}
        className="text-white opacity-75 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
