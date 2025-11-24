'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Person } from '@/mock/types';
import { COLUMNS_LENGTH, makeColumns } from '@/mock/tableData';
import {
  useTableData,
  useTableSorting,
  useInfiniteScroll,
  useVirtualPadding,
  useVirtualizedTable,
} from '@/lib/hooks';
import TableLoading from '@/components/table/TableLoading';
import TableContent from '@/components/table/TableContent';
import TableFooter from '@/components/table/TableFooter';

/**
 * High-performance virtual table component with infinite scrolling and sorting
 */
const Table = () => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Setup columns
  const columns = useMemo<ColumnDef<Person>[]>(
    () => makeColumns(COLUMNS_LENGTH) as unknown as ColumnDef<Person>[],
    []
  );

  // Setup sorting
  const { sorting, handleSortingChange } = useTableSorting();

  // Fetch data
  const { flatData, totalRowCount, totalFetched, isFetching, isLoading, fetchNextPage } =
    useTableData(sorting);

  // Setup table and virtualizers
  const { table, rowVirtualizer, columnVirtualizer } = useVirtualizedTable({
    data: flatData,
    columns,
    sorting,
    onSortingChange: handleSortingChange,
    containerRef: tableContainerRef,
  });

  // Setup infinite scroll
  const { containerRef, handleScroll } = useInfiniteScroll(
    () => fetchNextPage(),
    {
      threshold: 500,
      enabled: !isFetching && totalFetched < totalRowCount,
    }
  );

  // ...existing code...
  useEffect(() => {
    tableContainerRef.current = containerRef.current;
  }, [containerRef]);

  useEffect(() => {
    table.setOptions((prev) => ({
      ...prev,
      onSortingChange: handleSortingChange,
    }));
  }, [handleSortingChange, table]);

  useEffect(() => {
    handleScroll(tableContainerRef.current);
  }, [handleScroll]);

  // Calculate virtual padding
  const { paddingLeft: virtualPaddingLeft, paddingRight: virtualPaddingRight } =
    useVirtualPadding(columnVirtualizer);

  const virtualRows = rowVirtualizer.getVirtualItems();

  if (!isLoading) {
    return <TableLoading/>;
  }

  return (
    <div className="w-full flex flex-col justify-center items-center gap-4">
      <div
        className="container h-[800px] overflow-auto relative"
        ref={tableContainerRef}
        onScroll={(e) => handleScroll(e.currentTarget)}
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
      {/*<TableFooter isFetching={isFetching}/>*/}
    </div>
  );
};

export default Table;
