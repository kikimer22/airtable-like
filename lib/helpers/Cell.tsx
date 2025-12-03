import type { ColumnDef } from '@tanstack/react-table';
import EditableCell from '@/components/table/EditableCell';
import DefaultCell from '@/components/table/DefaultCell';
import type { DataTableRow } from '@/lib/types';
import type { TableFieldKind } from '@/lib/helpers/columnsCreator';

const Cell = (kind: TableFieldKind): Partial<ColumnDef<DataTableRow>> => {
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
          />
        );
      }
      if (kind === 'createdAt' || kind === 'updatedAt') {
        if (value === null || typeof value === 'undefined') return null;
        const dateObject = new Date(value as Date);
        return (
          <DefaultCell
            key={`${original.id}-${id}`}
            value={dateObject.toLocaleString()}
            rowIndex={index}
            columnId={id}
          />
        );
      }
      return (
        <DefaultCell
          key={`${index}-${id}`}
          value={value}
          rowIndex={index}
          columnId={id}
        />
      );
    },
  };
};

export default Cell;
