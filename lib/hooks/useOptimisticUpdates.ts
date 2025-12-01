'use client';

import { useCallback, useMemo } from 'react';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient';
import type { CellChange, DataTableRow, PageParam, TableResponse } from '@/lib/types';
import { useSelectorOptimisticUpdates } from '@/lib/store/optimisticUpdatesStore';
import { error, warn } from '@/lib/logger';

export function useOptimisticUpdates() {
  const queryClient = getQueryClient();
  const {
    registerChange: storeRegisterChange,
    getCellState,
    setCellState,
    clearCellState,
    getPendingChanges,
    isCellModified,
    clearAll,
    changesCount,
  } = useSelectorOptimisticUpdates();

  const registerChange = useCallback((change: CellChange) => {
    storeRegisterChange(change);

    queryClient.setQueryData<InfiniteData<TableResponse, PageParam> | undefined>(['table'], (pages) => {
      if (!pages?.pages) return pages as InfiniteData<TableResponse, PageParam> | undefined;

      const updatedPages = pages.pages.map((page) => {
        let changed = false;
        const data = page.data.map((row) => {
          if (row.id !== change.rowId) return row;
          changed = true;
          return { ...row, [change.columnId as keyof DataTableRow]: change.newValue } as DataTableRow;
        });
        return changed ? { ...page, data } : page;
      });

      return { ...pages, pages: updatedPages } as InfiniteData<TableResponse, PageParam>;
    });
  }, [queryClient, storeRegisterChange]);

  const submitChanges = useCallback(async (): Promise<boolean> => {
    const changesArray = getPendingChanges();
    if (changesArray.length === 0) return true;

    try {
      const res = await fetch('/api/table/update-cells', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: changesArray }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        const details = typeof data.details === 'string' ? data.details : `Server error: ${res.status}`;
        error('update-cells failed:', details);
        return false;
      }

      const pages = queryClient.getQueryData<InfiniteData<TableResponse, PageParam>>(['table']);
      const changedRowIds = new Set<number>(changesArray.map((c) => c.rowId));
      const hadCache = !!pages?.pages && pages.pages.some((page) => page.data.some((r) => changedRowIds.has(r.id)));

      if (pages?.pages) {
        const changesMap = new Map(changesArray.map((c) => [`${c.rowId}-${c.columnId}`, c]));
        const updatedPages = pages.pages.map((page) => ({
          ...page,
          data: page.data.map((row) => {
            let mutated = false;
            const updatedRow = { ...row } as DataTableRow;
            for (const change of changesMap.values()) {
              if (change.rowId === row.id) {
                updatedRow[change.columnId as keyof DataTableRow] = change.newValue as never;
                mutated = true;
              }
            }
            return mutated ? updatedRow : row;
          }),
        }));
        queryClient.setQueryData(['table'], { ...pages, pages: updatedPages });
      }

      clearAll();

      if (hadCache) {
        try {
          await queryClient.invalidateQueries({ queryKey: ['table'] });
        } catch {
          warn('revalidate table failed');
        }
      }

      return true;
    } catch (err) {
      error('save failed', err);
      return false;
    }
  }, [getPendingChanges, queryClient, clearAll]);

  const cancelChanges = useCallback(() => {
    const pages = queryClient.getQueryData<UseInfiniteQueryResult<InfiniteData<TableResponse, PageParam>, Error>>(['table']);
    clearAll();
    if (pages) {
      void queryClient.invalidateQueries({ queryKey: ['table'] });
    }
  }, [queryClient, clearAll]);

  const hasChanges = useMemo(() => changesCount > 0, [changesCount]);

  return {
    registerChange,
    submitChanges,
    cancelChanges,
    isCellModified,
    getCellState,
    setCellState,
    clearCellState,
    hasChanges,
    changesCount,
  };
}
