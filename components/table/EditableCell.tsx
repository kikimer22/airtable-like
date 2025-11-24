'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Table, TableMeta } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import type { MockDataRow } from '@/lib/types/table';

type PrimitiveKind = 'number' | 'boolean' | 'string' | 'nullish';

const detectKind = (val: unknown): PrimitiveKind => {
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (val === null || typeof val === 'undefined') return 'nullish';
  return 'string';
};

const toDisplayValue = (val: unknown): string => {
  if (val === null || typeof val === 'undefined') return '';
  return String(val);
};

const parseByKind = (kind: PrimitiveKind, raw: string): unknown => {
  if (kind === 'number') {
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (kind === 'boolean') {
    return raw.trim().toLowerCase() === 'true';
  }
  if (kind === 'nullish' && raw === '') {
    return null;
  }
  return raw;
};

interface TableMetaWithUpdate extends TableMeta<MockDataRow> {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  isSaving?: boolean;
}

interface EditableCellProps {
  value: unknown;
  rowIndex: number;
  columnId: string;
  table: Table<MockDataRow>;
}

const EditableCell = ({ value, rowIndex, columnId, table }: EditableCellProps) => {
  const meta = table.options.meta as TableMetaWithUpdate | undefined;
  const isSaving = Boolean(meta?.isSaving);

  const [draftValue, setDraftValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const kindRef = useRef<PrimitiveKind>(detectKind(value));
  const initialValueRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    kindRef.current = detectKind(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    if (isSaving || isEditing) return;
    const currentValue = toDisplayValue(value);
    initialValueRef.current = currentValue;
    setDraftValue(currentValue);
    setIsEditing(true);
  };

  const publishChange = useCallback(
    (rawValue: string) => {
      const parsed = parseByKind(kindRef.current, rawValue);
      meta?.updateData?.(rowIndex, columnId, parsed);
    },
    [columnId, meta, rowIndex]
  );

  const finalizeEdit = (shouldCommit: boolean) => {
    if (!isEditing) return;
    const hasChanged = draftValue !== initialValueRef.current;
    setIsEditing(false);
    if (!shouldCommit) {
      setDraftValue(initialValueRef.current);
      publishChange(initialValueRef.current);
      return;
    }
    if (!hasChanged) return;
    publishChange(draftValue);
  };

  const handleBlur = () => {
    finalizeEdit(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      finalizeEdit(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      finalizeEdit(false);
    }
  };

  return (
    <Input
      ref={inputRef}
      id={`editable-cell-${rowIndex}-${columnId}`}
      value={isEditing ? draftValue : toDisplayValue(value)}
      onFocus={startEditing}
      onChange={(e) => {
        if (!isEditing) startEditing();
        const nextValue = e.target.value;
        setDraftValue(nextValue);
        publishChange(nextValue);
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      readOnly={isSaving}
      disabled={isSaving}
      className="w-full min-w-0 px-2 py-1 border border-gray-300 rounded bg-white disabled:opacity-60"
    />
  );
};

export default EditableCell;

