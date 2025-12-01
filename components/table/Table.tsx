'use client';

import type { RefObject, MouseEvent, KeyboardEvent } from 'react';
import { useRef } from 'react';
import type { Cell, Header, HeaderGroup, Row, Table } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import type { DataTableRow } from '@/lib/types';
import { columns } from '@/lib/helpers/columnsCreator';
import {
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableFooter,
  UiTableHead,
  UiTableHeader,
  UiTableRow
} from '@/components/ui/table';
import TableSkeleton from '@/components/table/TableSkeleton';
import { TABLE_CONFIG } from '@/lib/constants';
import type { UseTableDataResult } from '@/lib/hooks/useTableData';
import {
  useTableData,
  useVirtualColumn,
  useVirtualRow,
  useBidirectionalInfinite,
  useOptimisticUpdates
} from '@/lib/hooks';
import { error } from '@/lib/logger';

export function Table() {
  const tableData = useTableData();
  const { hasChanges, cancelChanges, submitChanges } = useOptimisticUpdates();

  const table: Table<DataTableRow> = useReactTable({
    data: tableData.flattenedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (tableData.isLoading) {
    return (
      <div className="container h-[785px] overflow-auto relative">
        <TableSkeleton rows={TABLE_CONFIG.FETCH_SIZE}
                       columns={9}/>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <TableContainer
        table={table}
        tableData={tableData}
      />
      {hasChanges && (
        <div className="flex gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded">
          <button
            onClick={() => submitChanges().catch(err => {
              error('Submit error:', err);
            })}
            className="ml-auto px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => cancelChanges()}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// =================================== CONTAINER ===================================

interface TableContainerProps {
  table: Table<DataTableRow>;
  tableData: UseTableDataResult;
}

function TableContainer({
  table,
  tableData: {
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    flattenedData,
    loadedPagesCount,
  },
}: TableContainerProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { columnVirtualizer, virtualPaddingLeft, virtualPaddingRight } = useVirtualColumn({ table, tableContainerRef });

  const { headerRef, footerRef } = useBidirectionalInfinite({
    parentRef: tableContainerRef,
    totalDataLength: flattenedData.length,
    fetchNextPage,
    fetchPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    loadedPagesCount,
  });

  return (
    <div className="container h-[785px] overflow-auto relative"
         ref={tableContainerRef}
         id="table-container"
    >
      <div ref={headerRef} className="h-0"/>
      <UiTable>
        <TableHead
          columnVirtualizer={columnVirtualizer}
          table={table}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
        />
        <TableBody
          columnVirtualizer={columnVirtualizer}
          table={table}
          tableContainerRef={tableContainerRef}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
        />
        <UiTableFooter>
          <UiTableRow ref={footerRef}>
            <UiTableCell colSpan={9}>
              <div className={`flex items-center gap-2 min-h-9`}>
                {isFetchingNextPage ? (
                  <>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"/>
                    <span>Loading new rows...</span>
                  </>
                ) : (
                  <span>All available rows loaded</span>
                )}
              </div>
            </UiTableCell>
          </UiTableRow>
        </UiTableFooter>
      </UiTable>
    </div>
  );
}

// =================================== HEAD ===================================

interface TableHeadProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  table: Table<DataTableRow>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
}

function TableHead({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
}: TableHeadProps) {
  return (
    <UiTableHeader>
      {table.getHeaderGroups().map(headerGroup => (
        <TableHeadRow
          columnVirtualizer={columnVirtualizer}
          headerGroup={headerGroup}
          key={headerGroup.id}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
        />
      ))}
    </UiTableHeader>
  );
}

interface TableHeadRowProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  headerGroup: HeaderGroup<DataTableRow>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
}

function TableHeadRow({
  columnVirtualizer,
  headerGroup,
  virtualPaddingLeft,
  virtualPaddingRight,
}: TableHeadRowProps) {
  const virtualColumns = columnVirtualizer.getVirtualItems();
  return (
    <UiTableRow key={headerGroup.id}>
      {virtualPaddingLeft ? (<UiTableHead style={{ width: virtualPaddingLeft }}/>) : null}
      {virtualColumns.map(virtualColumn => {
        const header = headerGroup.headers[virtualColumn.index];
        return <TableHeadCell key={header.id} header={header}/>;
      })}
      {virtualPaddingRight ? (<UiTableHead style={{ width: virtualPaddingRight }}/>) : null}
    </UiTableRow>
  );
}

interface TableHeadCellProps {
  header: Header<DataTableRow, unknown>;
}

const getSortIcon = (sortState: 'asc' | 'desc' | false | null): string | null => {
  if (sortState === 'asc') return '🔼';
  if (sortState === 'desc') return '🔽';
  return null;
};

function TableHeadCell({ header }: TableHeadCellProps) {
  const canSort = header.column.getCanSort();
  const sortingState = header.column.getIsSorted() as 'asc' | 'desc' | null;
  const sortIcon = getSortIcon(sortingState);
  const toggleSortingHandler = header.column.getToggleSortingHandler();

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (canSort && toggleSortingHandler) {
      e.preventDefault();
      e.stopPropagation();
      toggleSortingHandler(e);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (canSort && toggleSortingHandler && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      toggleSortingHandler(e);
    }
  };

  return (
    <UiTableHead key={header.id} className="bg-secondary" style={{ width: header.getSize() }}>
      <div
        className={`flex items-center gap-1 min-h-9 text-primary ${canSort ? 'cursor-pointer select-none' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={canSort ? 'button' : undefined}
        tabIndex={canSort ? 0 : undefined}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {sortIcon && <span aria-label={`Sort ${sortingState}`}>{sortIcon}</span>}
      </div>
    </UiTableHead>
  );
}

// =================================== BODY ===================================

interface TableBodyProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  table: Table<DataTableRow>;
  tableContainerRef: RefObject<HTMLDivElement | null>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
}

function TableBody({
  columnVirtualizer,
  table,
  tableContainerRef,
  virtualPaddingLeft,
  virtualPaddingRight,
}: TableBodyProps) {
  const { rows, rowVirtualizer, virtualRows } = useVirtualRow({ table, tableContainerRef });
  return (
    <UiTableBody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
      {virtualRows.map(virtualRow => {
        const row = rows[virtualRow.index] as Row<DataTableRow>;
        return (
          <TableBodyRow
            columnVirtualizer={columnVirtualizer}
            key={row.id}
            row={row}
            rowVirtualizer={rowVirtualizer}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
            virtualRow={virtualRow}
          />
        );
      })}
    </UiTableBody>
  );
}

interface TableBodyRowProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  row: Row<DataTableRow>;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
  virtualRow: VirtualItem;
}

function TableBodyRow({
  columnVirtualizer,
  row,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualRow,
}: TableBodyRowProps) {
  const visibleCells = row.getVisibleCells();
  const virtualColumns = columnVirtualizer.getVirtualItems();
  return (
    <UiTableRow
      data-index={virtualRow.index}
      ref={node => rowVirtualizer.measureElement(node)}
      key={row.id}
      className="absolute top-0 left-0 will-change-transform"
      style={{ transform: `translateY(${virtualRow.start}px)` }} //this should always be a `style` as it changes on scroll
    >
      {virtualPaddingLeft ? (<UiTableCell style={{ width: virtualPaddingLeft }}/>) : null}
      {virtualColumns.map(vc => {
        const cell = visibleCells[vc.index];
        return <TableBodyCell key={cell.id} cell={cell}/>;
      })}
      {virtualPaddingRight ? (<UiTableCell style={{ width: virtualPaddingRight }}/>) : null}
    </UiTableRow>
  );
}

interface TableBodyCellProps {
  cell: Cell<DataTableRow, string | number | boolean>;
}

function TableBodyCell({ cell }: TableBodyCellProps) {
  return (
    <UiTableCell key={cell.id} style={{ width: cell.column.getSize() }}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </UiTableCell>
  );
}
