'use client';

import { useEffect, useRef, useState } from 'react';
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
}

interface EditableCellProps {
  value: unknown;
  rowIndex: number;
  columnId: string;
  table: Table<MockDataRow>;
}

const EditableCell = ({ value, rowIndex, columnId, table }: EditableCellProps) => {
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const kindRef = useRef<PrimitiveKind>(detectKind(value));
  useEffect(() => {
    kindRef.current = detectKind(value);
  }, [value]);
  const displayValue = draftValue ?? toDisplayValue(value);

  const onBlur = () => {
    const meta = table.options.meta as TableMetaWithUpdate | undefined;
    if (!meta?.updateData) return;
    const parsedValue = parseByKind(kindRef.current, displayValue);
    meta.updateData(rowIndex, columnId, parsedValue);
    setDraftValue(null);
  };

  return (
    <Input
      value={displayValue}
      onChange={(e) => setDraftValue(e.target.value)}
      onBlur={onBlur}
      className="w-full px-2 py-1 border border-gray-300 rounded bg-white"
      style={{ minWidth: '100%' }}
    />
  );
};

export default EditableCell;

