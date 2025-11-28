import type { DataTable } from '@/lib/generated/prisma/client';

export type DataTableRow = DataTable;

export interface DbUpdateEvent {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: DataTableRow;
  changes?: Record<string, { old: string, new: string }>;
}

export type Cursor = string | null;

export interface PageParam {
  cursor: Cursor;
  direction: 'forward' | 'backward';
}

export type TableResponse = PaginationResponse<DataTableRow>;

export interface PaginationMeta {
  nextCursor: Cursor;
  prevCursor: Cursor;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pageSize: number;
}

export interface PaginationResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CellKey {
  rowId: number;
  columnId: string;
}

export interface CellChange extends CellKey {
  oldValue?: unknown;
  newValue: unknown;
}

export interface OriginalValues extends CellKey {
  value: unknown;
}
