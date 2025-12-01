'use client';

import { useRef, useCallback } from 'react';
import type { SSENotification } from '@/lib/types';
import { debug, warn, error } from '@/lib/logger';

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
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isManuallyClosedRef = useRef(false);
  const lastSeenRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;
    if (!('EventSource' in window)) {
      const err = new Error('EventSource not supported');
      onError?.(err);
      return;
    }

    try {
      isManuallyClosedRef.current = false;
      const es = new EventSource('/api/table/notifications');
      eventSourceRef.current = es;

      es.addEventListener('open', () => {
        debug('connected', 'sse');
        onConnect?.();
      });

      es.addEventListener('message', (event) => {
        try {
          if (event.data.startsWith(':')) return;
          const notification: SSENotification = JSON.parse(event.data);
          const dedupeKey = `${notification.tableName}-${notification.logId.toString()}`;
          if (lastSeenRef.current.has(dedupeKey)) return;
          lastSeenRef.current.add(dedupeKey);
          onMessage(notification);
        } catch (err) {
          error('SSE parse failed', err);
          onError?.(err instanceof Error ? err : new Error('SSE parse'));
        }
      });

      es.addEventListener('error', () => {
        if (isManuallyClosedRef.current) return;
        warn('SSE error', 'sse');
        es.close();
        eventSourceRef.current = null;
        onDisconnect?.();
        const delay = Math.min(1000 * Math.pow(2, 3), 30000);
         
        // eslint-disable-next-line react-hooks/immutability
        reconnectTimeoutRef.current = window.setTimeout(() => connect(), delay) as unknown as number;
      });
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('SSE connect failed'));
    }
  }, [onMessage, onError, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (reconnectTimeoutRef.current) window.clearTimeout(reconnectTimeoutRef.current);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    onDisconnect?.();
  }, [onDisconnect]);

  return { disconnect, connect };
};
