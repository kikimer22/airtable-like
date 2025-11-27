'use client';

import type { RefObject, MouseEvent, KeyboardEvent } from 'react';
import { useMemo, useRef } from 'react';
import type { Cell, ColumnDef, Header, HeaderGroup, Row, Table } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { DataTableRow } from '@/lib/types';
import { makeColumns } from '@/lib/helpers/columnsCreator';
import { useTableData } from '@/lib/hooks/useTableData';
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
import { useBidirectionalInfinite } from '@/lib/hooks/useBidirectionalInfinite';
import { useOptimisticUpdates } from '@/lib/hooks/useOptimisticUpdates';

export function Table() {
  const tableData = useTableData();
  const { registerChange, isCellModified, hasChanges, cancelChanges, submitChanges } = useOptimisticUpdates();

  const columns: ColumnDef<DataTableRow>[] = useMemo<ColumnDef<DataTableRow>[]>(() =>
      makeColumns(TABLE_CONFIG.COLUMNS_LENGTH, {
        onRegisterChange: registerChange,
        isModified: isCellModified,
      }),
    [registerChange, isCellModified]);

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
              console.error('Submit error:', err);
            })}
            className="ml-auto px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Зберегти
          </button>
          <button
            onClick={() => cancelChanges()}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Скасувати
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
  const visibleColumns = table.getVisibleLeafColumns();
  const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    count: visibleColumns.length,
    estimateSize: index => visibleColumns[index].getSize(),
    getScrollElement: () => tableContainerRef.current,
    overscan: TABLE_CONFIG.COLUMNS_OVERSCAN,
    horizontal: true,
  });
  const virtualColumns = columnVirtualizer.getVirtualItems();
  let virtualPaddingLeft: number | undefined;
  let virtualPaddingRight: number | undefined;
  if (columnVirtualizer && virtualColumns?.length) {
    virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
    virtualPaddingRight =
      columnVirtualizer.getTotalSize() -
      (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
  }

  const { headerRef, footerRef } = useBidirectionalInfinite({
    parentRef: tableContainerRef,
    fetchNextPage,
    fetchPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    rowHeight: TABLE_CONFIG.ROW_HEIGHT,
    pageSize: TABLE_CONFIG.FETCH_SIZE,
    totalDataLength: flattenedData.length,
    maxPages: TABLE_CONFIG.FETCH_MAX_PAGES,
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
            <UiTableCell colSpan={visibleColumns.length}>
              <div className={`flex items-center gap-2 min-h-9`}>
                {isFetchingNextPage ? (
                  <>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"/>
                    <span>Завантаження нових рядків...</span>
                  </>
                ) : (
                  <span>Всі доступні рядки завантажені</span>
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
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => TABLE_CONFIG.ROW_HEIGHT,
    getScrollElement: () => tableContainerRef.current,
    overscan: TABLE_CONFIG.ROWS_OVERSCAN,
    // TODO: Enable dynamic row height measurement
    // measureElement:
    //   typeof window !== 'undefined' &&
    //   navigator.userAgent.indexOf('Firefox') === -1
    //     ? element => element?.getBoundingClientRect().height
    //     : undefined,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
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
      style={{
        transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
      }}
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
