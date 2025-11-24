import { useState, useCallback } from 'react';
import type { SortingState, OnChangeFn } from '@tanstack/react-table';

/**
 * Hook for managing table sorting with optimistic updates
 */
export const useTableSorting = () => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      // Optimistic update - immediately update UI
      setSorting(updater);
    },
    []
  );

  return { sorting, setSorting, handleSortingChange };
};

