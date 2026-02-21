'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AnyRealtimeEvent, WebSocketMessage } from '@/types/realtime';

interface UseRealtimeSyncOptions {
  channels?: string[];
  enabled?: boolean;
  onEvent?: (event: AnyRealtimeEvent) => void;
  pollInterval?: number; // Fallback polling interval in ms
}

/**
 * Hook for real-time sync with WebSocket fallback to polling
 */
export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
  const { channels = [], enabled = true, onEvent, pollInterval = 5000 } =
    options;

  const { data: session } = useSession();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set(channels));

  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<number>(Date.now());
  const [stats, setStats] = useState({
    messagesReceived: 0,
    lastError: null as string | null,
  });

  // Setup polling fallback
  const setupPolling = useCallback(() => {
    if (!session?.user) return;

    console.log('[Polling] Starting fallback polling');

    const poll = async () => {
      try {
        const sinceTimestamp = Math.floor(lastEventTime / 1000);
        const response = await fetch(
          `/api/dashboard?since=${sinceTimestamp}`
        );

        if (!response.ok) throw new Error('Polling failed');

        const data = await response.json() as Record<string, unknown>;
        const userId = (session?.user as { id?: string })?.id;
        if (data.changed && userId) {
          setLastEventTime(Date.now());
          onEvent?.({
            type: 'dashboard:invalidate',
            data: { keys: Object.keys(data) },
            timestamp: new Date().toISOString(),
            userId,
          });
        }
      } catch (error) {
        console.error('[Polling] Error:', error);
      }
    };

    pollIntervalRef.current = setInterval(poll, pollInterval);
  }, [session?.user, lastEventTime, onEvent, pollInterval]);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!session?.user || !enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${window.location.host}/api/ws`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        setStats((s) => ({ ...s, lastError: null }));

        // Subscribe to channels
        subscriptionsRef.current.forEach((channel) => {
          const message: WebSocketMessage = {
            type: 'subscribe',
            channel,
            timestamp: new Date().toISOString(),
          };
          wsRef.current?.send(JSON.stringify(message));
        });

        // Start heartbeat
        const heartbeatInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
              })
            );
          }
        }, 30000);

        return () => clearInterval(heartbeatInterval);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AnyRealtimeEvent;
          setLastEventTime(Date.now());
          setStats((s) => ({ ...s, messagesReceived: s.messagesReceived + 1 }));
          onEvent?.(data);
        } catch (error) {
          console.error('[WS] Error parsing message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);

        // Attempt reconnection after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('[WS] Error:', error);
        setStats((s) => ({
          ...s,
          lastError: 'WebSocket connection error',
        }));
      };
    } catch (error) {
      console.error('[WS] Connection failed:', error);
      setStats((s) => ({
        ...s,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      }));

      // Fallback to polling
      setupPolling();
    }
  }, [session?.user, enabled, onEvent, setupPolling]);

  // Subscribe to new channels
  const subscribe = useCallback((channel: string) => {
    if (subscriptionsRef.current.has(channel)) return;

    subscriptionsRef.current.add(channel);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'subscribe',
        channel,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Unsubscribe from channels
  const unsubscribe = useCallback((channel: string) => {
    if (!subscriptionsRef.current.has(channel)) return;

    subscriptionsRef.current.delete(channel);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'unsubscribe',
        channel,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    if (!enabled || !session?.user) return;

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [enabled, session?.user, connectWebSocket]);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    lastEventTime,
    stats,
  };
}
