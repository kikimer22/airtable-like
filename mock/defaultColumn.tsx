import type { ColumnDef } from '@tanstack/react-table';
import type { Person } from '@/mock/types';
import EditableCell from '@/components/table/EditableCell';

const defaultColumn: Partial<ColumnDef<Person>> = {
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

export default defaultColumn;
