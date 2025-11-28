'use client';

import { Input } from '@/components/ui/input';
import type { TableFieldKind } from '@/lib/helpers/columnsCreator';
import DefaultCell from '@/components/table/DefaultCell';
import { toDisplayValue } from '@/lib/utils';
import { useEditableCell } from '@/lib/hooks/useEditableCell';

interface EditableCellProps {
  kind: TableFieldKind;
  value: unknown;
  columnId: string;
  rowId: number;
}

const EditableCell = ({ kind, value, columnId, rowId }: EditableCellProps) => {
  const { isModified, internalValue, handleChange } = useEditableCell({ rowId, columnId, value });

  if (value === null || typeof value === 'undefined') return (
    <DefaultCell
      value={toDisplayValue(value)}
      rowIndex={0}
      columnId={columnId}
    />
  );

  const containerClass = isModified ? 'ring-2 ring-amber-400 rounded' : '';

  if (kind === 'string') return (
    <div className={containerClass}>
      <Input
        id={`editable-cell-string-${rowId}-${columnId}`}
        value={typeof internalValue === 'string' ? internalValue : String(internalValue ?? '')}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white"
      />
    </div>
  );

  if (kind === 'boolean') return (
    <div className={`w-full flex items-center justify-center ${containerClass}`}>
      <Input
        type="checkbox"
        id={`editable-cell-boolean-${rowId}-${columnId}`}
        checked={!!internalValue}
        onChange={(e) => handleChange(e.target.checked)}
        className="w-8 min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white hover:cursor-pointer"
      />
    </div>
  );

  if (kind === 'number') return (
    <div className={containerClass}>
      <Input
        type="number"
        id={`editable-cell-number-${rowId}-${columnId}`}
        value={toDisplayValue(internalValue)}
        onChange={(e) => handleChange(e.target.value ? parseInt(e.target.value, 10) : null)}
        className="w-full min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white"
      />
    </div>
  );

  return (
    <DefaultCell
      value={toDisplayValue(value)}
      rowIndex={0}
      columnId={columnId}
    />
  );
};

export default EditableCell;
