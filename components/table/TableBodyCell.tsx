import type { Cell } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { UiTableCell } from '@/components/ui/table';
import type { MockDataRow } from '@/lib/types/table';

interface TableBodyCellProps {
  cell: Cell<MockDataRow, unknown>;
}

/**
 * Table body cell component
 */
const TableBodyCell = ({ cell }: TableBodyCellProps) => (
  <UiTableCell key={cell.id} style={{ width: cell.column.getSize() }}>
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </UiTableCell>
);

export default TableBodyCell;
