'use client';

import type { RefObject, MouseEvent, KeyboardEvent, UIEvent } from 'react';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import type { Cell, ColumnDef, Header, HeaderGroup, Row, Table } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MockDataRow } from '@/lib/types';
import { makeColumns } from '@/lib/helpers/columnsCreator';
import { useTableData } from '@/lib/hooks/useTableData';
import { useInView } from 'react-intersection-observer';
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
import { decodeCursor } from '@/lib/utils';
import type { UseTableDataResult } from '@/lib/hooks/useTableData';

export function Table() {
  const tableData = useTableData();

  const columns: ColumnDef<MockDataRow>[] = useMemo<ColumnDef<MockDataRow>[]>(() => makeColumns(TABLE_CONFIG.COLUMNS_LENGTH), []);

  const table: Table<MockDataRow> = useReactTable({
    data: tableData.flattenedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  if (tableData.isLoading) {
    return (
      <div className="container h-[785px] overflow-auto relative">
        <TableSkeleton rows={table.getRowModel().rows.length || TABLE_CONFIG.ROW_HEIGHT}
                       columns={table.getVisibleLeafColumns().length || 9}/>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => tableData.fetchNextPage()}>fetchNextPage Data</button>
      <div><br/></div>
      <button onClick={() => tableData.fetchPreviousPage()}>fetchPreviousPage Data</button>
      <br/>
      <br/>
      <TableContainer table={table} tableData={tableData}/>
    </div>
  );
}

// =================================== CONTAINER ===================================

interface TableContainerProps {
  table: Table<MockDataRow>;
  tableData: UseTableDataResult;
}

function TableContainer({
  table, tableData: {
    data,
    flattenedData,
    isLoading,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    isFetching,
  }
}: TableContainerProps) {
  const isPageLimitReached = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cursor = (data as any)?.pageParams?.at(-1)?.cursor;
    const currentPageIndex = cursor ? Math.ceil(decodeCursor(cursor) / TABLE_CONFIG.FETCH_SIZE) : 0;
    return currentPageIndex >= (TABLE_CONFIG.FETCH_MAX_PAGES || 0);
  }, [data]);
  const { ref: footerAnchorRef, inView } = useInView();
  const visibleColumns = table.getVisibleLeafColumns();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const columnVirtualizer = useVirtualizer<
    HTMLDivElement,
    HTMLTableCellElement
  >({
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

  //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        //once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
        if (scrollHeight - scrollTop - clientHeight < 500 && !isFetchingNextPage && hasNextPage) {
          void fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetchingNextPage, hasNextPage]
  );

  // //a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  // useEffect(() => {
  //   fetchMoreOnBottomReached(tableContainerRef.current);
  // }, [fetchMoreOnBottomReached]);

  // const onScroll = ({ currentTarget: { scrollTop } }: UIEvent<HTMLDivElement>) => {
  //   console.warn('scrollTop', scrollTop);
  //   if (isPageLimitReached && scrollTop < (TABLE_CONFIG.ROW_HEIGHT + TABLE_CONFIG.ROWS_OVERSCAN) && hasPreviousPage && !isFetchingPreviousPage && !isLoading) {
  //     void fetchPreviousPage();
  //   }
  // };
  //
  // useEffect(() => {
  //   if (inView && !isFetchingNextPage && hasNextPage && !isLoading) {
  //     void fetchNextPage();
  //   }
  // }, [inView, isFetchingNextPage, hasNextPage, isLoading, fetchNextPage]);
  //
  // useEffect(() => {
  //   if (isPageLimitReached) {
  //     tableContainerRef.current?.scrollBy({
  //       top: -(TABLE_CONFIG.ROW_HEIGHT * (TABLE_CONFIG.FETCH_SIZE + TABLE_CONFIG.ROWS_OVERSCAN) + 2),
  //       behavior: 'auto',
  //     });
  //   } else {
  //     tableContainerRef.current?.scrollBy({
  //       top: -(TABLE_CONFIG.ROW_HEIGHT + 2),
  //       behavior: 'instant',
  //     });
  //   }
  //
  // }, [isPageLimitReached]);

  return (
    <div className="container h-[785px] overflow-auto relative"
         onScroll={e => fetchMoreOnBottomReached(e.currentTarget)}
         ref={tableContainerRef}
    >
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
          <UiTableRow ref={footerAnchorRef}>
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
  table: Table<MockDataRow>;
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
  headerGroup: HeaderGroup<MockDataRow>;
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
  header: Header<MockDataRow, unknown>;
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
  table: Table<MockDataRow>;
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
  // useEffect(() => {
  //   console.log('rows', rows);
  // }, [rows]);
  //
  // useEffect(() => {
  //   console.log('virtualRows', virtualRows);
  // }, [virtualRows]);
  return (
    <UiTableBody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
      {virtualRows.map(virtualRow => {
        const row = rows[virtualRow.index] as Row<MockDataRow>;
        // console.log('Virtual virtualRow:', virtualRow);
        // console.log('Rows:', row);
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
  row: Row<MockDataRow>;
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
      className="absolute will-change-transform"
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
  cell: Cell<MockDataRow, string | number | boolean>;
}

function TableBodyCell({ cell }: TableBodyCellProps) {
  return (
    <UiTableCell key={cell.id} style={{ width: cell.column.getSize() }}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </UiTableCell>
  );
}
