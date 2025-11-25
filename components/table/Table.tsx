'use client';

import {
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
  useTransition,
  useDeferredValue,
} from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMutation } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient';
import { TABLE_CONFIG, makeColumns } from '@/lib/table/tableData';
import {
  useTableData,
  useTableSorting,
  useVirtualPadding,
  useVirtualizedTable,
  useTableEditing, useEventSource,
} from '@/lib/hooks';
import TableLoading from '@/components/Table-2/TableLoading';
import TableContent from '@/components/table/TableContent';
import TableFooter from '@/components/table/TableFooter';
import type { MockDataApiResponse, MockDataRow, MockDataUpdatePayload } from '@/lib/types/table';
import { saveTableChanges } from '@/lib/api/tableData';

const Table = () => {
  const prevSortingRef = useRef<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [requestedPage, setRequestedPage] = useState(0);
  const pendingScrollPageRef = useRef<number | null>(null);
  const [scrollSignal, setScrollSignal] = useState(0);
  const [isPageTransitionPending, startPageTransition] = useTransition();
  const { messages, connectionStatus } = useEventSource();
  const queryClient = getQueryClient();

  // 1. Setup sorting (optimistic update)
  const { sorting, handleSortingChange } = useTableSorting();

  const handleSortingChangeWithReset = useCallback(
    (updater: Parameters<typeof handleSortingChange>[0]) => {
      pendingScrollPageRef.current = 0;
      setScrollSignal((token) => token + 1);
      startPageTransition(() => setRequestedPage(0));
      handleSortingChange(updater);
    },
    [handleSortingChange],
  );

  // 2. Fetch data with current sorting (React Query auto-refetches when queryKey changes)
  const {
    baseQueryKey,
    flatData,
    segments,
    currentPage,
    isFetching,
    isLoading,
  } = useTableData(sorting, requestedPage, TABLE_CONFIG.FETCH_SIZE);

  // 3. Setup table editing
  const deferredData = useDeferredValue(flatData);
  const {
    editedData,
    updateData,
    resetData,
    hasPendingEdits,
    serializeEdits,
  } = useTableEditing(deferredData);

  const {
    mutateAsync: persistChanges,
    isPending: isSaving,
  } = useMutation({
    mutationFn: saveTableChanges,
  });

  // 4. Setup columns
  const columns = useMemo<ColumnDef<MockDataRow>[]>(() => makeColumns(TABLE_CONFIG.COLUMNS_LENGTH), []);

  // 5. Setup table and virtualizers
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { table, rowVirtualizer, columnVirtualizer } = useVirtualizedTable({
    data: editedData,
    columns,
    sorting,
    onSortingChange: handleSortingChangeWithReset,
    containerRef,
    onUpdateData: updateData,
    isSaving,
  });

  // 6. Reset scroll on sorting change
  useEffect(() => {
    const sortingKey = JSON.stringify(sorting);
    if (sortingKey !== prevSortingRef.current && prevSortingRef.current !== '') {
      prevSortingRef.current = sortingKey;
      if (rowVirtualizer) {
        rowVirtualizer.scrollToIndex?.(0);
      }
    } else if (prevSortingRef.current === '') {
      prevSortingRef.current = sortingKey;
    }
  }, [sorting, rowVirtualizer]);

  // 7. Calculate virtual padding
  const { paddingLeft: virtualPaddingLeft, paddingRight: virtualPaddingRight } =
    useVirtualPadding(columnVirtualizer);

  const virtualRows = rowVirtualizer.getVirtualItems();

  const pageOffsets = useMemo(() => {
    const offsets = new Map<number, number>();
    let offset = 0;
    segments.forEach((segment) => {
      offsets.set(segment.page, offset);
      offset += segment.rows.length;
    });
    return offsets;
  }, [segments]);

  const pageRanges = useMemo(() => {
    const ranges: Array<{ page: number; start: number; end: number }> = [];
    let offset = 0;
    segments.forEach((segment) => {
      const start = offset;
      const end = start + segment.rows.length;
      ranges.push({ page: segment.page, start, end });
      offset = end;
    });
    return ranges;
  }, [segments]);

  const majorityPage = useMemo(() => {
    if (!virtualRows.length) return currentPage;
    const midIndex = Math.round(
      (virtualRows[0].index + virtualRows[virtualRows.length - 1].index) / 2,
    );
    const range =
      pageRanges.find((candidate) => midIndex >= candidate.start && midIndex < candidate.end) ??
      pageRanges[pageRanges.length - 1];
    return range?.page ?? currentPage;
  }, [virtualRows, pageRanges, currentPage]);

  useEffect(() => {
    console.log('messages', messages);
  }, [messages]);

  useEffect(() => {
    if (pendingScrollPageRef.current != null) return;
    if (majorityPage === requestedPage) return;
    startPageTransition(() => setRequestedPage(majorityPage));
  }, [majorityPage, requestedPage, startPageTransition]);

  useEffect(() => {
    const targetPage = pendingScrollPageRef.current;
    if (targetPage == null) return;
    const targetOffset = pageOffsets.get(targetPage);
    if (targetOffset == null) return;
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    rowVirtualizer.scrollToIndex(targetOffset);
    pendingScrollPageRef.current = null;
  }, [scrollSignal, pageOffsets, rowVirtualizer]);

  const handleResetChanges = useCallback(() => {
    setSaveError(null);
    resetData();
  }, [resetData]);

  const updateQueryCache = useCallback(
    (changes: MockDataUpdatePayload) => {
      if (!changes.length) return;
      const changeMap = new Map(changes.map(({ id, data }) => [id, data]));
      queryClient
        .getQueryCache()
        .findAll({ queryKey: baseQueryKey, exact: false })
        .forEach((cacheEntry) => {
          queryClient.setQueryData<MockDataApiResponse>(cacheEntry.queryKey, (prev) => {
            if (!prev) return prev;
            const updatedData = prev.data.map((row) => {
              const update = changeMap.get(row.id);
              return update ? { ...row, ...update } : row;
            });
            return { ...prev, data: updatedData };
          });
        });
    },
    [queryClient, baseQueryKey],
  );

  const handleSaveChanges = useCallback(async () => {
    if (!hasPendingEdits) return;
    setSaveError(null);
    const payload = serializeEdits();
    if (!payload.length) return;
    try {
      await persistChanges(payload);
      updateQueryCache(payload);
      resetData();
    } catch (error) {
      console.error('Failed to save table changes', error);
      setSaveError(error instanceof Error ? error.message : 'Не вдалося зберегти зміни');
    }
  }, [hasPendingEdits, serializeEdits, persistChanges, updateQueryCache, resetData]);

  if (isLoading) {
    return <TableLoading/>;
  }

  return (
    <div className="relative w-full flex flex-col justify-center items-center gap-2">
      <div>connectionStatus: {connectionStatus}</div>
      <div
        className="container h-[785px] overflow-auto relative"
        ref={containerRef}
      >
        <TableContent
          table={table}
          columnVirtualizer={columnVirtualizer}
          rowVirtualizer={rowVirtualizer}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          virtualRows={virtualRows}
        />
      </div>
      <TableFooter
        isFetching={isFetching || isPageTransitionPending}
        hasChanges={hasPendingEdits}
        isSaving={isSaving}
        onSave={handleSaveChanges}
        onReset={handleResetChanges}
        errorMessage={saveError}
      />
    </div>
  );
};

export default Table;
