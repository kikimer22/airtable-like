'use client';

import { Input } from '@/components/ui/input';
import type { TableFieldKind } from '@/lib/helpers/columnsCreator';
import DefaultCell from '@/components/table/DefaultCell';
import { useState, useCallback, useEffect } from 'react';
import { toDisplayValue } from '@/lib/utils';
import { useOptimisticUpdates } from '@/lib/hooks/useOptimisticUpdates';

interface EditableCellProps {
  kind: TableFieldKind;
  value: unknown;
  columnId: string;
  rowId: number;
  onRegisterChange?: (rowId: number, columnId: string, oldValue: unknown, newValue: unknown) => void;
  isModified?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
}

const EditableCell = ({
  kind,
  value,
  columnId,
  rowId,
  onRegisterChange,
  isModified,
  onCancel,
}: EditableCellProps) => {
  const { getCellState, setCellState, clearCellState } = useOptimisticUpdates();

  const savedState = getCellState(rowId, columnId);
  const [internalValue, setInternalValue] = useState(savedState ?? value);

  const handleChange = useCallback((newValue: unknown) => {
    setInternalValue(newValue);
    if (onRegisterChange) {
      onRegisterChange(rowId, columnId, value, newValue);
    }
  }, [rowId, columnId, value, onRegisterChange]);

  useEffect(() => {
    return () => {
      if (isModified) {
        if (internalValue !== value) {
          setCellState(rowId, columnId, internalValue);
        } else {
          clearCellState(rowId, columnId);
        }
      }
    };
  }, [isModified, rowId, columnId, internalValue, value, setCellState, clearCellState]);

  useEffect(() => {
    if (!isModified) {
      onCancel?.();
    }
  }, [isModified, onCancel]);

  if (value === null || typeof value === 'undefined') {
    return (
      <DefaultCell
        kind={kind}
        value={toDisplayValue(value)}
        rowIndex={0}
        columnId={columnId}
      />
    );
  }

  const containerClass = isModified ? 'ring-2 ring-amber-400 rounded' : '';

  if (kind === 'string') {
    return (
      <div className={containerClass}>
        <Input
          id={`editable-cell-string-${rowId}-${columnId}`}
          value={typeof internalValue === 'string' ? internalValue : String(internalValue ?? '')}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white"
        />
      </div>
    );
  }

  if (kind === 'boolean') {
    return (
      <div className={`w-full flex items-center justify-center ${containerClass}`}>
        <Input
          type="checkbox"
          id={`editable-cell-boolean-${rowId}-${columnId}`}
          checked={Boolean(internalValue)}
          onChange={(e) => handleChange(e.target.checked)}
          className="w-8 min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white hover:cursor-pointer"
        />
      </div>
    );
  }

  if (kind === 'number') {
    return (
      <div className={containerClass}>
        <Input
          type="number"
          id={`editable-cell-number-${rowId}-${columnId}`}
          value={internalValue === null || internalValue === undefined ? '' : String(internalValue)}
          onChange={(e) => handleChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="w-full min-w-0 min-h-9 px-2 py-1 border border-gray-300 rounded bg-white"
        />
      </div>
    );
  }

  return (
    <DefaultCell
      kind={kind}
      value={toDisplayValue(value)}
      rowIndex={0}
      columnId={columnId}
    />
  );
};

export default EditableCell;
