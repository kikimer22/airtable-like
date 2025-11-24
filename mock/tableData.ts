import type { ColumnDef } from '@tanstack/react-table';
import defaultColumn from '@/mock/defaultColumn';
import type { MockDataRow } from '@/lib/types/table';
import { TABLE_FIELD_KEYS, getFieldKind } from '@/lib/table/schema';
import type { TableFieldKind } from '@/lib/table/schema';

export const TABLE_CONFIG = {
  FETCH_SIZE: 50,
  FETCH_THRESHOLD: 0,
  FETCH_ROOT_MARGIN: 500,
  ROW_HEIGHT: 38,
  ROWS_ON_VIEW: 25,
  COLUMNS_ON_VIEW: 10,
  TABLE_HEIGHT: 785,
  COLUMNS_LENGTH: TABLE_FIELD_KEYS.length,
} as const;

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
      ...defaultColumn,
    };
  });
};

const PREPARED_COLUMNS = buildColumns();

export const makeColumns = (count: number): ColumnDef<MockDataRow>[] => {
  if (count <= 0) return [];
  if (count >= PREPARED_COLUMNS.length) return PREPARED_COLUMNS;
  return PREPARED_COLUMNS.slice(0, count);
};
