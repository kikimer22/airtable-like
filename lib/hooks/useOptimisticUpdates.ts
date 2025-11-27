'use client';

import { useCallback, useRef, useState } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient';
import type { DataTableRow, PaginationResponse, Cursor } from '@/lib/types';

interface CellChange {
  rowId: number;
  columnId: string;
  newValue: unknown;
}

interface OriginalValues {
  rowId: number;
  columnId: string;
  value: unknown;
}

interface PageParam {
  cursor: Cursor;
  direction: 'forward' | 'backward';
}

type Response = PaginationResponse<DataTableRow>;

export function useOptimisticUpdates() {
  const queryClient = getQueryClient();
  const pendingChangesRef = useRef(new Map<string, CellChange>());
  const originalValuesRef = useRef(new Map<string, OriginalValues>());
  const cellStatesRef = useRef(new Map<string, unknown>());
  const [changesCount, setChangesCount] = useState(0);

  const registerChange = useCallback((
    rowId: number,
    columnId: string,
    oldValue: unknown,
    newValue: unknown,
  ) => {
    const key = `${rowId}-${columnId}`;

    if (!originalValuesRef.current.has(key)) {
      originalValuesRef.current.set(key, { rowId, columnId, value: oldValue });
    }

    if (oldValue === newValue) {
      pendingChangesRef.current.delete(key);
      setChangesCount(pendingChangesRef.current.size);
      return;
    }
    pendingChangesRef.current.set(key, { rowId, columnId, newValue });
    setChangesCount(pendingChangesRef.current.size);
  }, []);

  const getCellState = useCallback((rowId: number, columnId: string) => {
    const key = `${rowId}-${columnId}`;
    return cellStatesRef.current.get(key);
  }, []);

  const setCellState = useCallback((rowId: number, columnId: string, state: unknown) => {
    const key = `${rowId}-${columnId}`;
    cellStatesRef.current.set(key, state);
  }, []);

  const clearCellState = useCallback((rowId: number, columnId: string) => {
    const key = `${rowId}-${columnId}`;
    cellStatesRef.current.delete(key);
  }, []);

  const submitChanges = useCallback(async (): Promise<boolean> => {
    if (pendingChangesRef.current.size === 0) {
      return true;
    }

    const changesArray = Array.from(pendingChangesRef.current.values());

    try {
      const response = await fetch('/api/table/update-cells', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: changesArray }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errorMessage = typeof data.details === 'string' ? data.details : `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const pages = queryClient.getQueryData<InfiniteData<Response, PageParam>>(['table']);
      if (pages?.pages) {
        const updatedPages = pages.pages.map((page) => ({
          ...page,
          data: page.data.map((row) => {
            const changesForRow = Array.from(pendingChangesRef.current.values())
              .filter(c => c.rowId === row.id);

            if (changesForRow.length === 0) {
              return row;
            }

            const updatedRow = { ...row };
            changesForRow.forEach(change => {
              updatedRow[change.columnId as keyof DataTableRow] = change.newValue as never;
            });

            return updatedRow;
          }),
        }));

        queryClient.setQueryData(['table'], { ...pages, pages: updatedPages });
      }

      pendingChangesRef.current.clear();
      originalValuesRef.current.clear();
      cellStatesRef.current.clear();
      setChangesCount(0);

      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to save changes');
    }
  }, [queryClient]);

  const cancelChanges = useCallback(() => {
    pendingChangesRef.current.clear();
    originalValuesRef.current.clear();
    cellStatesRef.current.clear();
    setChangesCount(0);
  }, []);

  const isCellModified = useCallback((rowId: number, columnId: string) => {
    const key = `${rowId}-${columnId}`;
    return pendingChangesRef.current.has(key);
  }, []);

  return {
    registerChange,
    submitChanges,
    cancelChanges,
    isCellModified,
    getCellState,
    setCellState,
    clearCellState,
    hasChanges: changesCount > 0,
    changesCount,
  };
}

