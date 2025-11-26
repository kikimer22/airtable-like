import type { ColumnDef } from '@tanstack/react-table';
import type { MockDataRow } from '@/lib/types';
import Cell from '@/lib/helpers/Cell';
import { createRange, padKey } from '@/lib/utils';

export const TABLE_COLUMN_SEGMENTS = [
  { prefix: 'col_s_', start: 1, end: 4, kind: 'string' as const }, // 100
  { prefix: 'col_n_', start: 101, end: 105, kind: 'number' as const }, // 172
  { prefix: 'col_b_', start: 173, end: 178, kind: 'boolean' as const }, // 222
] as const;

const buildKeys = (): string[] => {
  const dynamicKeys = TABLE_COLUMN_SEGMENTS
    .flatMap(({ prefix, start, end }) =>
      createRange(start, end).map((value) => `${prefix}${padKey(value)}`),
    );
  return ['id', ...dynamicKeys];
};

export const TABLE_FIELD_KEYS = buildKeys();

export type TableFieldKey = (typeof TABLE_FIELD_KEYS)[number];

export type TableFieldKind = (typeof TABLE_COLUMN_SEGMENTS)[number]['kind'] | 'id';

export const getFieldKind = (field: TableFieldKey): TableFieldKind => {
  if (field === 'id') return 'id';
  const segment = TABLE_COLUMN_SEGMENTS.find(({ prefix }) => field.startsWith(prefix));
  return segment?.kind ?? 'string';
};

const columnWidths: Record<TableFieldKind, number> = {
  id: 72,
  string: 180,
  number: 140,
  boolean: 120,
};

const buildColumns = (): ColumnDef<MockDataRow>[] => {
  return TABLE_FIELD_KEYS.map((field) => {
    if (field === 'id') {
      return {
        accessorKey: field,
        header: 'ID',
        footer: (props) => props.column.id,
        size: columnWidths.id,
        enableSorting: true,
      };
    }

    const kind = getFieldKind(field);

    return {
      accessorKey: field,
      header: field.toUpperCase(),
      footer: (props) => props.column.id,
      size: columnWidths[kind] ?? columnWidths.string,
      enableSorting: true,
      ...Cell
    };
  });
};

const PREPARED_COLUMNS = buildColumns();

export const makeColumns = (count: number): ColumnDef<MockDataRow>[] => {
  if (count <= 0) return [];
  if (count >= PREPARED_COLUMNS.length) return PREPARED_COLUMNS;
  return PREPARED_COLUMNS.slice(0, count);
};
