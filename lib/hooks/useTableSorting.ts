import { useState, useCallback } from 'react';
import type { SortingState, OnChangeFn } from '@tanstack/react-table';

export const useTableSorting = () => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting(updater);
    },
    []
  );

  return { sorting, setSorting, handleSortingChange };
};

