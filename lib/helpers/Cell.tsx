import type { ColumnDef } from '@tanstack/react-table';
import EditableCell from '@/components/table/EditableCell';
import type { MockDataRow } from '@/lib/types';

const Cell: Partial<ColumnDef<MockDataRow>> = {
  cell: ({ getValue, row: { index }, column: { id }, table }) => {
    return (
      <EditableCell
        value={getValue()}
        rowIndex={index}
        columnId={id}
        table={table}
      />
    );
  },
};

export default Cell;
