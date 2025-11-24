import type { Table as TanstackTable } from '@tanstack/react-table';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { UiTable, UiTableHeader, UiTableBody, UiTableHead, UiTableRow } from '@/components/ui/table';
import TableHeaderCell from './TableHeaderCell';
import TableBodyRow from './TableBodyRow';
import type { MockDataRow } from '@/lib/types/table';

interface TableContentProps {
  table: TanstackTable<MockDataRow>;
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  virtualRows: VirtualItem[];
}

/**
 * Table content component with headers and body
 */
const TableContent = ({
  table,
  columnVirtualizer,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualRows,
}: TableContentProps) => {
  const { rows } = table.getRowModel();

  return (
    <UiTable>
      <UiTableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <UiTableRow key={headerGroup.id}>
            {virtualPaddingLeft ? (
              <UiTableHead style={{ width: virtualPaddingLeft }} />
            ) : null}
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
              const header = headerGroup.headers[virtualColumn.index];
              return <TableHeaderCell key={header.id} header={header} />;
            })}
            {virtualPaddingRight ? (
              <UiTableHead style={{ width: virtualPaddingRight }} />
            ) : null}
          </UiTableRow>
        ))}
      </UiTableHeader>
      <UiTableBody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;

          return (
            <TableBodyRow
              key={row.id}
              row={row}
              virtualRow={virtualRow}
              columnVirtualizer={columnVirtualizer}
              rowVirtualizer={rowVirtualizer}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
            />
          );
        })}
      </UiTableBody>
    </UiTable>
  );
};

export default TableContent;
