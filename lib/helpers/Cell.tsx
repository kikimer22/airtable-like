import type { ColumnDef } from '@tanstack/react-table';
import EditableCell from '@/components/table/EditableCell';
import DefaultCell from '@/components/table/DefaultCell';
import type { DataTableRow } from '@/lib/types';
import type { TableFieldKind } from '@/lib/helpers/columnsCreator';

interface CellOptions {
  onRegisterChange?: (rowId: number, columnId: string, oldValue: unknown, newValue: unknown) => void;
  isModified?: (rowId: number, columnId: string) => boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
}

const Cell = (kind: TableFieldKind, options?: CellOptions): Partial<ColumnDef<DataTableRow>> => {
  return {
    cell: ({ getValue, row: { index, original }, column: { id } }) => {
      const value = getValue();

      if (kind === 'string' || kind === 'number' || kind === 'boolean') {
        return (
          <EditableCell
            key={`${original.id}-${id}`}
            kind={kind}
            value={value}
            columnId={id}
            rowId={original.id}
            onRegisterChange={options?.onRegisterChange}
            isModified={options?.isModified ? options.isModified(original.id, id) : false}
            onSubmit={options?.onSubmit}
            onCancel={options?.onCancel}
          />
        );
      }
      return (
        <DefaultCell
          key={`${index}-${id}`}
          kind={kind}
          value={value}
          rowIndex={index}
          columnId={id}
        />
      );
    },
  };
};

export default Cell;
