'use client';

import { useCallback, useMemo } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient';
import type { CellChange, DataTableRow, PageParam, TableResponse } from '@/lib/types';
import { useSelectorOptimisticUpdates } from '@/lib/store/optimisticUpdatesStore';

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
  }, [storeRegisterChange]);

  const submitChanges = useCallback(async (): Promise<boolean> => {
    const changesArray = getPendingChanges();

    if (changesArray.length === 0) {
      return true;
    }

    try {
      const response = await fetch('/api/table/update-cells', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: changesArray }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errorMessage = typeof data.details === 'string' ? data.details : `Server error: ${response.status}`;
        console.error('API error:', errorMessage);
        return false;
      }

      const pages = queryClient.getQueryData<InfiniteData<TableResponse, PageParam>>(['table']);
      if (pages?.pages) {
        const changesMap = new Map(changesArray.map(c => [`${c.rowId}-${c.columnId}`, c]));
        const updatedPages = pages.pages.map((page) => ({
          ...page,
          data: page.data.map((row) => {
            let hasChanges = false;
            const updatedRow = { ...row };

            for (const change of changesMap.values()) {
              if (change.rowId === row.id) {
                updatedRow[change.columnId as keyof DataTableRow] = change.newValue as never;
                hasChanges = true;
              }
            }

            return hasChanges ? updatedRow : row;
          }),
        }));

        queryClient.setQueryData(['table'], { ...pages, pages: updatedPages });
      }

      clearAll();
      return true;
    } catch (error) {
      console.error('Failed to save changes:', error);
      if (error instanceof Error) {
        return false;
      }
      return false;
    }
  }, [queryClient, getPendingChanges, clearAll]);

  const cancelChanges = useCallback(() => {
    clearAll();
  }, [clearAll]);

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

