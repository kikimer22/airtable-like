'use client';

import { useRef, useCallback } from 'react';
import type { SSENotification } from '@/lib/types';

interface UseSSEListenerOptions {
  onMessage: (notification: SSENotification) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useSSEListener = ({
  onMessage,
  onError,
  onConnect,
  onDisconnect,
}: UseSSEListenerOptions) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef(false);

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;
    if (!('EventSource' in window)) {
      const error = new Error('EventSource is not supported');
      onError?.(error);
      return;
    }

    try {
      isManuallyClosedRef.current = false;
      eventSourceRef.current = new EventSource('/api/table/notifications');

      eventSourceRef.current.addEventListener('open', () => {
        console.log('✅ SSE connected');
        onConnect?.();
      });

      eventSourceRef.current.addEventListener('message', (event) => {
        try {
          // Ігноруємо service повідомлення
          if (event.data.startsWith(':')) return;

          const notification: SSENotification = JSON.parse(event.data);
          onMessage(notification);
        } catch (error) {
          console.error('❌ Parse error:', error);
          onError?.(error instanceof Error ? error : new Error('Parse failed'));
        }
      });

      eventSourceRef.current.addEventListener('error', () => {
        if (isManuallyClosedRef.current) return;

        console.warn('⚠️ SSE error, reconnecting...');
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        onDisconnect?.();

        const delay = Math.min(1000 * Math.pow(2, 3), 30000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      });
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Connection failed'));
    }
  }, [onMessage, onError, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    onDisconnect?.();
  }, [onDisconnect]);

  return {
    disconnect,
    connect,
  };
};
