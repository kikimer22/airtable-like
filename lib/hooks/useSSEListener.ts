'use client';

import { useRef, useCallback } from 'react';
import { DataTableRow, PageParam, SSENotification, TableResponse } from '@/lib/types';
import { debug, warn, error } from '@/lib/logger';
import { getQueryClient } from '@/lib/getQueryClient';
import { InfiniteData } from '@tanstack/react-query';

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
      const err = new Error('EventSource is not supported');
      onError?.(err);
      return;
    }

    try {
      isManuallyClosedRef.current = false;
      const es = new EventSource('/api/table/notifications');
      eventSourceRef.current = es;

      es.addEventListener('open', () => {
        debug('SSE connected', 'sse');
        onConnect?.();
      });

      es.addEventListener('message', (event) => {
        try {
          if (event.data.startsWith(':')) return;

          const notification: SSENotification = JSON.parse(event.data);

          const key = `${notification.tableName}-${notification.logId.toString()}`;
          if (lastSeenRef.current.has(key)) return;
          lastSeenRef.current.add(key);

          onMessage(notification);

          const queryClient = getQueryClient();
          const pages = queryClient.getQueryData<InfiniteData<TableResponse, PageParam>>(['table']);
          if (!pages?.pages) return;

          const changedId = notification.payload.id;
          const affected = pages.pages.some((p: TableResponse) => p.data.some((r: DataTableRow) => r.id === changedId));
          if (!affected) return;

          queryClient.setQueryData(['table'], (old: InfiniteData<TableResponse, PageParam>) => {
            if (!old?.pages) return old;
            const updatedPages = old.pages.map((page: TableResponse) => ({
              ...page,
              data: page.data.map((row: DataTableRow) => (row.id === changedId ? { ...row, ...notification.payload.data } : row)),
            }));
            return { ...old, pages: updatedPages };
          });

          debug({ table: notification.tableName, id: changedId }, 'sse-merge');
        } catch (err) {
          error('SSE parse/merge error', err);
          onError?.(err instanceof Error ? err : new Error('SSE parse failed'));
        }
      });

      es.addEventListener('error', () => {
        if (isManuallyClosedRef.current) return;

        warn('SSE error, attempting reconnect', 'sse');
        es.close();
        eventSourceRef.current = null;
        onDisconnect?.();

        const delay = Math.min(1000 * Math.pow(2, 3), 30000);
        // window.setTimeout returns number
        reconnectTimeoutRef.current = window.setTimeout(connect, delay) as unknown as number;
      });
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Connection failed'));
    }
  }, [onMessage, onError, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current as number);
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
