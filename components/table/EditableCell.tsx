'use client';

import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import type { MockDataRow } from '@/lib/types';
import { toDisplayValue } from '@/lib/utils';

interface EditableCellProps {
  value: unknown;
  rowIndex: number;
  columnId: string;
  table: Table<MockDataRow>;
}

const EditableCell = ({ value, rowIndex, columnId }: EditableCellProps) => {
  return (
    <Input
      disabled={true}
      id={`editable-cell-${rowIndex}-${columnId}`}
      value={toDisplayValue(value)}
      className="w-full min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white disabled:opacity-60"
    />
  );
};

export default EditableCell;
