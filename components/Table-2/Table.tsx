'use client';

import { RefObject, useEffect, useMemo, useRef } from 'react';
import type {
  Cell,
  ColumnDef,
  Header,
  HeaderGroup,
  Row,
  Table,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MockDataRow } from '@/lib/types/table';
import { makeColumns, TABLE_CONFIG } from '@/lib/table/tableData';
import { useTableData } from '@/lib/hooks/useTableData-2';
import { useInView } from 'react-intersection-observer';

export function Table() {
  const { ref, inView } = useInView();
  const {
    flattenedData,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage
  } = useTableData();

  useEffect(() => {
    console.log('Fetched flattenedData pages:', flattenedData);
  }, [flattenedData]);

  const columns = useMemo<ColumnDef<MockDataRow>[]>(() => makeColumns(TABLE_CONFIG.COLUMNS_LENGTH), []);

  const table = useReactTable({
    data: flattenedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  // useEffect(() => {
  //   if (inView && hasNextPage && !isFetchingNextPage) {
  //     void fetchNextPage();
  //   }
  // }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      <button onClick={() => fetchNextPage()}>fetchNextPage Data</button>
      <div><br/></div>
      <button onClick={() => fetchPreviousPage()}>fetchPreviousPage Data</button>
      <br/>
      <br/>
      <TableContainer table={table}/>
      <div ref={ref} style={{ height: '1px' }}/>
    </div>
  );
}

interface TableContainerProps {
  table: Table<MockDataRow>;
}

function TableContainer({ table }: TableContainerProps) {
  const visibleColumns = table.getVisibleLeafColumns();

  //The virtualizers need to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columnVirtualizer = useVirtualizer<
    HTMLDivElement,
    HTMLTableCellElement
  >({
    count: visibleColumns.length,
    estimateSize: index => visibleColumns[index].getSize(),
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: TABLE_CONFIG.COLUMNS_OVERSCAN,
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

  return (
    <div
      className="container h-[785px] overflow-auto relative"
      ref={tableContainerRef}
    >
      <table style={{ display: 'grid' }}>
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
      </table>
    </div>
  );
}

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
    <thead
      style={{
        display: 'grid',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
    {table.getHeaderGroups().map(headerGroup => (
      <TableHeadRow
        columnVirtualizer={columnVirtualizer}
        headerGroup={headerGroup}
        key={headerGroup.id}
        virtualPaddingLeft={virtualPaddingLeft}
        virtualPaddingRight={virtualPaddingRight}
      />
    ))}
    </thead>
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
    <tr key={headerGroup.id} style={{ display: 'flex', width: '100%' }}>
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingLeft }}/>
      ) : null}
      {virtualColumns.map(virtualColumn => {
        const header = headerGroup.headers[virtualColumn.index];
        return <TableHeadCell key={header.id} header={header}/>;
      })}
      {virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingRight }}/>
      ) : null}
    </tr>
  );
}

interface TableHeadCellProps {
  header: Header<MockDataRow, unknown>;
}

function TableHeadCell({ header }: TableHeadCellProps) {
  return (
    <th
      key={header.id}
      style={{
        display: 'flex',
        width: header.getSize(),
      }}
    >
      <div
        {...{
          className: header.column.getCanSort()
            ? 'cursor-pointer select-none'
            : '',
          onClick: header.column.getToggleSortingHandler(),
        }}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {{
          asc: ' 🔼',
          desc: ' 🔽',
        }[header.column.getIsSorted() as string] ?? null}
      </div>
    </th>
  );
}

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

  return (
    <tbody
      style={{
        display: 'grid',
        height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
        position: 'relative', //needed for absolute positioning of rows
      }}
    >
    {virtualRows.map(virtualRow => {
      const row = rows[virtualRow.index] as Row<MockDataRow>;

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
    </tbody>
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
    <tr
      data-index={virtualRow.index}
      ref={node => rowVirtualizer.measureElement(node)}
      key={row.id}
      style={{
        display: 'flex',
        position: 'absolute',
        transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
        width: '100%',
      }}
    >
      {virtualPaddingLeft ? (
        <td style={{ display: 'flex', width: virtualPaddingLeft }}/>
      ) : null}
      {virtualColumns.map(vc => {
        const cell = visibleCells[vc.index];
        return <TableBodyCell key={cell.id} cell={cell}/>;
      })}
      {virtualPaddingRight ? (
        <td style={{ display: 'flex', width: virtualPaddingRight }}/>
      ) : null}
    </tr>
  );
}

interface TableBodyCellProps {
  cell: Cell<MockDataRow, string | number | boolean>;
}

function TableBodyCell({ cell }: TableBodyCellProps) {
  return (
    <td
      key={cell.id}
      style={{
        display: 'flex',
        width: cell.column.getSize(),
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
}
