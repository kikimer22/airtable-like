"use client";

import { RefObject, useEffect, useMemo } from 'react';
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

export function Table() {
  const columns = useMemo<ColumnDef<MockDataRow>[]>(() => makeColumns(TABLE_CONFIG.COLUMNS_LENGTH), []);
  const { data, fetchNextPage, flattenedData } = useTableData();

  useEffect(() => {
    console.log('Fetched data pages:', data);
  }, [data]);

  useEffect(() => {
    console.log('Fetched flattenedData pages:', flattenedData);
  }, [flattenedData]);

  // const table = useReactTable({
  //   data,
  //   columns,
  //   getCoreRowModel: getCoreRowModel(),
  //   getSortedRowModel: getSortedRowModel(),
  //   debugTable: true,
  // });

  return (
    <div>
      <button onClick={() => fetchNextPage()}>Refresh Data</button>
      {/*<TableContainer table={table}/>*/}
    </div>
  );
}

// interface TableContainerProps {
//   table: Table<unknown>;
// }
//
// function TableContainer({ table }: TableContainerProps) {
//   const visibleColumns = table.getVisibleLeafColumns();
//
//   //The virtualizers need to know the scrollable container element
//   const tableContainerRef = React.useRef<HTMLDivElement>(null);
//
//   //we are using a slightly different virtualization strategy for columns (compared to virtual rows) in order to support dynamic row heights
//   const columnVirtualizer = useVirtualizer<
//     HTMLDivElement,
//     HTMLTableCellElement
//   >({
//     count: visibleColumns.length,
//     estimateSize: index => visibleColumns[index].getSize(), //estimate width of each column for accurate scrollbar dragging
//     getScrollElement: () => tableContainerRef.current,
//     horizontal: true,
//     overscan: 3, //how many columns to render on each side off screen each way (adjust this for performance)
//   });
//
//   const virtualColumns = columnVirtualizer.getVirtualItems();
//
//   //different virtualization strategy for columns - instead of absolute and translateY, we add empty columns to the left and right
//   let virtualPaddingLeft: number | undefined;
//   let virtualPaddingRight: number | undefined;
//
//   if (columnVirtualizer && virtualColumns?.length) {
//     virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
//     virtualPaddingRight =
//       columnVirtualizer.getTotalSize() -
//       (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
//   }
//
//   return (
//     <div
//       className="container"
//       ref={tableContainerRef}
//       style={{
//         overflow: 'auto', //our scrollable table container
//         position: 'relative', //needed for sticky header
//         height: '800px', //should be a fixed height
//       }}
//     >
//       {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
//       <table style={{ display: 'grid' }}>
//         <TableHead
//           columnVirtualizer={columnVirtualizer}
//           table={table}
//           virtualPaddingLeft={virtualPaddingLeft}
//           virtualPaddingRight={virtualPaddingRight}
//         />
//         <TableBody
//           columnVirtualizer={columnVirtualizer}
//           table={table}
//           tableContainerRef={tableContainerRef}
//           virtualPaddingLeft={virtualPaddingLeft}
//           virtualPaddingRight={virtualPaddingRight}
//         />
//       </table>
//     </div>
//   );
// }
//
// interface TableHeadProps {
//   columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
//   table: Table<unknown>;
//   virtualPaddingLeft: number | undefined;
//   virtualPaddingRight: number | undefined;
// }
//
// function TableHead({
//   columnVirtualizer,
//   table,
//   virtualPaddingLeft,
//   virtualPaddingRight,
// }: TableHeadProps) {
//   return (
//     <thead
//       style={{
//         display: 'grid',
//         position: 'sticky',
//         top: 0,
//         zIndex: 1,
//       }}
//     >
//     {table.getHeaderGroups().map(headerGroup => (
//       <TableHeadRow
//         columnVirtualizer={columnVirtualizer}
//         headerGroup={headerGroup}
//         key={headerGroup.id}
//         virtualPaddingLeft={virtualPaddingLeft}
//         virtualPaddingRight={virtualPaddingRight}
//       />
//     ))}
//     </thead>
//   );
// }
//
// interface TableHeadRowProps {
//   columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
//   headerGroup: HeaderGroup<unknown>;
//   virtualPaddingLeft: number | undefined;
//   virtualPaddingRight: number | undefined;
// }
//
// function TableHeadRow({
//   columnVirtualizer,
//   headerGroup,
//   virtualPaddingLeft,
//   virtualPaddingRight,
// }: TableHeadRowProps) {
//   const virtualColumns = columnVirtualizer.getVirtualItems();
//   return (
//     <tr key={headerGroup.id} style={{ display: 'flex', width: '100%' }}>
//       {virtualPaddingLeft ? (
//         //fake empty column to the left for virtualization scroll padding
//         <th style={{ display: 'flex', width: virtualPaddingLeft }}/>
//       ) : null}
//       {virtualColumns.map(virtualColumn => {
//         const header = headerGroup.headers[virtualColumn.index];
//         return <TableHeadCell key={header.id} header={header}/>;
//       })}
//       {virtualPaddingRight ? (
//         //fake empty column to the right for virtualization scroll padding
//         <th style={{ display: 'flex', width: virtualPaddingRight }}/>
//       ) : null}
//     </tr>
//   );
// }
//
// interface TableHeadCellProps {
//   header: Header<unknown, string | number>;
// }
//
// function TableHeadCell({ header }: TableHeadCellProps) {
//   return (
//     <th
//       key={header.id}
//       style={{
//         display: 'flex',
//         width: header.getSize(),
//       }}
//     >
//       <div
//         {...{
//           className: header.column.getCanSort()
//             ? 'cursor-pointer select-none'
//             : '',
//           onClick: header.column.getToggleSortingHandler(),
//         }}
//       >
//         {flexRender(header.column.columnDef.header, header.getContext())}
//         {{
//           asc: ' 🔼',
//           desc: ' 🔽',
//         }[header.column.getIsSorted() as string] ?? null}
//       </div>
//     </th>
//   );
// }
//
// interface TableBodyProps {
//   columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
//   table: Table<unknown>;
//   tableContainerRef: RefObject<HTMLDivElement>;
//   virtualPaddingLeft: number | undefined;
//   virtualPaddingRight: number | undefined;
// }
//
// function TableBody({
//   columnVirtualizer,
//   table,
//   tableContainerRef,
//   virtualPaddingLeft,
//   virtualPaddingRight,
// }: TableBodyProps) {
//   const { rows } = table.getRowModel();
//
//   //dynamic row height virtualization - alternatively you could use a simpler fixed row height strategy without the need for `measureElement`
//   const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
//     count: rows.length,
//     estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
//     getScrollElement: () => tableContainerRef.current,
//     //measure dynamic row height, except in firefox because it measures table border height incorrectly
//     measureElement:
//       typeof window !== 'undefined' &&
//       navigator.userAgent.indexOf('Firefox') === -1
//         ? element => element?.getBoundingClientRect().height
//         : undefined,
//     overscan: 5,
//   });
//
//   const virtualRows = rowVirtualizer.getVirtualItems();
//
//   return (
//     <tbody
//       style={{
//         display: 'grid',
//         height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
//         position: 'relative', //needed for absolute positioning of rows
//       }}
//     >
//     {virtualRows.map(virtualRow => {
//       const row = rows[virtualRow.index] as Row<Person>;
//
//       return (
//         <TableBodyRow
//           columnVirtualizer={columnVirtualizer}
//           key={row.id}
//           row={row}
//           rowVirtualizer={rowVirtualizer}
//           virtualPaddingLeft={virtualPaddingLeft}
//           virtualPaddingRight={virtualPaddingRight}
//           virtualRow={virtualRow}
//         />
//       );
//     })}
//     </tbody>
//   );
// }
//
// interface TableBodyRowProps {
//   columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
//   row: Row<unknown>;
//   rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
//   virtualPaddingLeft: number | undefined;
//   virtualPaddingRight: number | undefined;
//   virtualRow: VirtualItem;
// }
//
// function TableBodyRow({
//   columnVirtualizer,
//   row,
//   rowVirtualizer,
//   virtualPaddingLeft,
//   virtualPaddingRight,
//   virtualRow,
// }: TableBodyRowProps) {
//   const visibleCells = row.getVisibleCells();
//   const virtualColumns = columnVirtualizer.getVirtualItems();
//   return (
//     <tr
//       data-index={virtualRow.index} //needed for dynamic row height measurement
//       ref={node => rowVirtualizer.measureElement(node)} //measure dynamic row height
//       key={row.id}
//       style={{
//         display: 'flex',
//         position: 'absolute',
//         transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
//         width: '100%',
//       }}
//     >
//       {virtualPaddingLeft ? (
//         //fake empty column to the left for virtualization scroll padding
//         <td style={{ display: 'flex', width: virtualPaddingLeft }}/>
//       ) : null}
//       {virtualColumns.map(vc => {
//         const cell = visibleCells[vc.index];
//         return <TableBodyCell key={cell.id} cell={cell}/>;
//       })}
//       {virtualPaddingRight ? (
//         //fake empty column to the right for virtualization scroll padding
//         <td style={{ display: 'flex', width: virtualPaddingRight }}/>
//       ) : null}
//     </tr>
//   );
// }
//
// interface TableBodyCellProps {
//   cell: Cell<unknown, string | number | boolean>;
// }
//
// function TableBodyCell({ cell }: TableBodyCellProps) {
//   return (
//     <td
//       key={cell.id}
//       style={{
//         display: 'flex',
//         width: cell.column.getSize(),
//       }}
//     >
//       {flexRender(cell.column.columnDef.cell, cell.getContext())}
//     </td>
//   );
// }
