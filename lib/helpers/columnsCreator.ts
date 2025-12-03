import type { ColumnDef } from '@tanstack/react-table';
import type { DataTableRow } from '@/lib/types';
import Cell from '@/lib/helpers/Cell';
import { createRange, padKey } from '@/lib/utils';
import { TABLE_CONFIG } from '@/lib/constants';

export const TABLE_COLUMN_SEGMENTS = [
  { prefix: 'col_s_', start: 1, end: 9, kind: 'string' as const }, // 11
  { prefix: 'col_n_', start: 1, end: 9, kind: 'number' as const }, // 11
  { prefix: 'col_b_', start: 1, end: 9, kind: 'boolean' as const }, // 11
] as const;

const buildKeys = (): string[] => {
  const dynamicKeys = TABLE_COLUMN_SEGMENTS
    .flatMap(({ prefix, start, end }) =>
      createRange(start, end).map((value) => `${prefix}${padKey(value)}`),
    );
  return ['id', ...dynamicKeys, 'createdAt', 'updatedAt'];
};

export const TABLE_FIELD_KEYS = buildKeys();

export type TableFieldKey = (typeof TABLE_FIELD_KEYS)[number];

export type TableFieldKind = (typeof TABLE_COLUMN_SEGMENTS)[number]['kind'] | 'id' | 'createdAt' | 'updatedAt';

export const getFieldKind = (field: TableFieldKey): TableFieldKind => {
  if (field === 'id') return 'id';
  if (field === 'createdAt') return 'createdAt';
  if (field === 'updatedAt') return 'updatedAt';
  const segment = TABLE_COLUMN_SEGMENTS.find(({ prefix }) => field.startsWith(prefix));
  return segment?.kind ?? 'string';
};

const getSizeForKind = (kind: TableFieldKind): number => {
  if (kind === 'id') return TABLE_CONFIG.COLUMN_WIDTHS_ID;
  if (kind === 'createdAt' || kind === 'updatedAt') return TABLE_CONFIG.COLUMN_WIDTHS_DATE;
  if (kind === 'number') return TABLE_CONFIG.COLUMN_WIDTHS_NUMBER;
  if (kind === 'boolean') return TABLE_CONFIG.COLUMN_WIDTHS_BOOLEAN;
  return TABLE_CONFIG.COLUMN_WIDTHS_STRING;
};

const buildColumns = (): ColumnDef<DataTableRow>[] => {
  return TABLE_FIELD_KEYS.map((field) => {
    const kind = getFieldKind(field);
    return {
      accessorKey: field,
      header: field.toUpperCase(),
      footer: (props) => props.column.id,
      size: getSizeForKind(kind),
      enableSorting: true,
      ...Cell(kind),
    };
  });
};

const makeColumns = (count: number): ColumnDef<DataTableRow>[] => {
  if (count <= 0) return [];

  const columns = buildColumns();

  if (count >= columns.length) return columns;
  return columns.slice(0, count);
};

export const columns: ColumnDef<DataTableRow>[] = makeColumns(TABLE_CONFIG.COLUMNS_LENGTH);
