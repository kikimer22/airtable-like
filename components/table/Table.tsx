'use client';

import { useMemo, useEffect, useRef } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { TABLE_CONFIG, makeColumns } from '@/mock/tableData';
import {
  useTableData,
  useTableSorting,
  useInfiniteScroll,
  useVirtualPadding,
  useVirtualizedTable,
  useTableEditing,
} from '@/lib/hooks';
import TableLoading from '@/components/table/TableLoading';
import TableContent from '@/components/table/TableContent';
import TableFooter from '@/components/table/TableFooter';
import type { MockDataRow } from '@/lib/types/table';

/**
 * High-performance virtual table component with infinite scrolling and sorting
 */
const Table = () => {
  const prevSortingRef = useRef<string>('');

  // 1. Setup sorting (optimistic update)
  const { sorting, handleSortingChange } = useTableSorting();

  // 2. Fetch data with current sorting (React Query auto-refetches when queryKey changes)
  const { flatData, totalRowCount, totalFetched, isFetching, isLoading, fetchNextPage } =
    useTableData(sorting);

  // 3. Setup table editing
  const { editedData, updateData } = useTableEditing(flatData);

  // 4. Setup infinite scroll
  const { containerRef, sentinelRef } = useInfiniteScroll(
    () => fetchNextPage(),
    {
      enabled: !isFetching && totalFetched < totalRowCount,
    }
  );

  // 5. Setup columns
  const columns = useMemo<ColumnDef<MockDataRow>[]>(() => makeColumns(TABLE_CONFIG.COLUMNS_LENGTH), []);

  // 6. Setup table and virtualizers
  const { table, rowVirtualizer, columnVirtualizer } = useVirtualizedTable({
    data: editedData,
    columns,
    sorting,
    onSortingChange: handleSortingChange,
    containerRef,
    onUpdateData: updateData,
  });

  // 7. Reset scroll on sorting change
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

  // 8. Calculate virtual padding
  const { paddingLeft: virtualPaddingLeft, paddingRight: virtualPaddingRight } =
    useVirtualPadding(columnVirtualizer);

  const virtualRows = rowVirtualizer.getVirtualItems();

  if (isLoading) {
    return <TableLoading/>;
  }

  return (
    <div className="relative w-full flex flex-col justify-center items-center gap-2">
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
        <div ref={sentinelRef} style={{ height: '1px' }}/>
      </div>
      <TableFooter isFetching={isFetching}/>
    </div>
  );
};

export default Table;
