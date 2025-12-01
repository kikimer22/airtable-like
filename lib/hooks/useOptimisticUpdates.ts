'use client';

import { useCallback } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient';
import type { CellChange, DataTableRow, PageParam, TableResponse } from '@/lib/types';
import { useSelectorOptimisticUpdates } from '@/lib/store/optimisticUpdatesStore';
import { error } from '@/lib/logger';

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

    queryClient.setQueryData<InfiniteData<TableResponse, PageParam>>(['table'], (pages) => {
      if (!pages?.pages) return pages;

      const updatedPages = pages.pages.map((page) => {
        let changed = false;
        const data = page.data.map((row) => {
          if (row.id !== change.rowId) return row;
          changed = true;
          return { ...row, [change.columnId as keyof DataTableRow]: change.newValue } as DataTableRow;
        });
        return changed ? { ...page, data } : page;
      });

      return { ...pages, pages: updatedPages };
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
      if (pages?.pages) {
        const changesMap = new Map(changesArray.map((c) => [`${c.rowId}-${c.columnId}`, c]));
        const updatedPages = pages.pages.map((page) => ({
          ...page,
          data: page.data.map((row) => {
            const updatedRow = { ...row } as DataTableRow;
            let mutated = false;
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

      return true;
    } catch (err) {
      error('save failed', err);
      return false;
    }
  }, [getPendingChanges, queryClient, clearAll]);

  const cancelChanges = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const hasChanges = changesCount > 0;

  return {
    registerChange,
    submitChanges,
    cancelChanges,
    isCellModified,
    getCellState,
    setCellState,
    clearCellState,
    getPendingChanges,
    hasChanges,
    changesCount,
  };
}
