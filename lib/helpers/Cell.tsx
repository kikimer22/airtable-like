import type { ColumnDef } from '@tanstack/react-table';
import EditableCell from '@/components/table/EditableCell';
import DefaultCell from '@/components/table/DefaultCell';
import type { MockDataRow } from '@/lib/types';
import type { TableFieldKind } from '@/lib/helpers/columnsCreator';

const Cell = (kind: TableFieldKind): Partial<ColumnDef<MockDataRow>> => {
  return {
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
      if (kind === 'string' || kind === 'number' || kind === 'boolean') {
        return (
          <EditableCell
            kind={kind}
            value={getValue()}
            rowIndex={index}
            columnId={id}
            table={table}
          />
        );
      }
      return (
        <DefaultCell
          kind={kind}
          value={getValue()}
          rowIndex={index}
          columnId={id}
          table={table}
        />
      );
    },
  };
};

export default Cell;
