'use client';

import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import type { MockDataRow } from '@/lib/types';
import { toDisplayValue } from '@/lib/utils';
import type { TableFieldKind } from '@/lib/helpers/columnsCreator';
import DefaultCell from '@/components/table/DefaultCell';

interface EditableCellProps {
  kind: TableFieldKind;
  value: unknown;
  rowIndex: number;
  columnId: string;
  table: Table<MockDataRow>;
}

const EditableCell = ({ kind, value, rowIndex, columnId, table }: EditableCellProps) => {
  if (value === null || typeof value === 'undefined') {
    return (
      <DefaultCell
        kind={kind}
        value={value}
        rowIndex={rowIndex}
        columnId={columnId}
        table={table}
      />
    );
  }

  if (kind === 'string') {
    return (
      <Input
        disabled={true}
        id={`editable-cell-string-${rowIndex}-${columnId}`}
        value={toDisplayValue(value)}
        onChange={() => {}}
        className="w-full min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white disabled:opacity-60"
      />
    );
  }

  if (kind === 'boolean') {
    return (
      <div className="w-full flex items-center justify-center">
        <Input
          type="checkbox"
          disabled={false}
          id={`editable-cell-boolean-${rowIndex}-${columnId}`}
          defaultChecked={value as boolean}
          onChange={() => {}}
          className="w-8 min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white disabled:opacity-60 hover:cursor-pointer"
        />
      </div>
    );
  }

  if (kind === 'number') {
    return (
      <Input
        type="number"
        disabled={false}
        id={`editable-cell-number-${rowIndex}-${columnId}`}
        value={toDisplayValue(value)}
        onChange={() => {}}
        className="w-full min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white disabled:opacity-60"
      />
    );
  }

  return (
    <DefaultCell
      kind={kind}
      value={value}
      rowIndex={rowIndex}
      columnId={columnId}
      table={table}
    />
  );
};

export default EditableCell;
