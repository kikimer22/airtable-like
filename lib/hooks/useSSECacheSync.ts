'use client';

import { useRef } from 'react';
import type { SSENotification, TableResponse, PageParam } from '@/lib/types';
import type { InfiniteData } from '@tanstack/react-query';
import { TABLE_QUERY_KEY } from './useTableData';
import { debug } from '@/lib/logger';
import { getQueryClient } from '@/lib/getQueryClient';
import { TABLE_ALLOWED_FIELDS } from '@/lib/constants';

interface UseSSECacheSyncOptions {
  locallyModifiedRowIds?: Set<number>;
}

export function useSSECacheSync({ locallyModifiedRowIds }: UseSSECacheSyncOptions = {}) {
  const queryClient = getQueryClient();
  const lastSyncRef = useRef<Set<string>>(new Set());

  return (notification: SSENotification) => {
    const key = `${notification.tableName}-${notification.logId.toString()}`;
    if (lastSyncRef.current.has(key)) return;
    lastSyncRef.current.add(key);

    if (notification.action !== 'UPDATE') return;

    const changedId = notification.payload.id;
    if (locallyModifiedRowIds?.has(changedId)) return;

    queryClient.setQueryData<InfiniteData<TableResponse, PageParam> | undefined>(TABLE_QUERY_KEY, (pages) => {
      if (!pages?.pages) return pages;

      const hasRow = pages.pages.some((page) => page.data.some((row) => row.id === changedId));
      if (!hasRow) {
        debug({ id: changedId }, 'sse-skip-absent');
        return pages;
      }

      const filteredData = Object.fromEntries(
        Object.entries(notification.payload.data).filter(([key]) => TABLE_ALLOWED_FIELDS.has(key))
      );

      const updatedPages = pages.pages.map((page) => ({
        ...page,
        data: page.data.map((row) => (row.id === changedId ? { ...row, ...filteredData } : row)),
      }));

      debug({ id: changedId, fields: Object.keys(notification.payload.changes || {}) }, 'sse-cache-merge');
      return { ...pages, pages: updatedPages };
    });
  };
}
