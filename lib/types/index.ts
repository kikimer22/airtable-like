import type { DataTable } from '@/lib/generated/prisma/client';

export type DataTableRow = DataTable;

export type ChangeAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface FieldChange {
  old: unknown;
  new: unknown;
}

export interface NotificationPayload {
  id: number;
  table: string;
  action: ChangeAction;
  timestamp: string;
  data: Record<string, unknown>;
  changes: Record<string, FieldChange>;
}

export interface SSENotification {
  logId: bigint;
  tableName: string;
  action: ChangeAction;
  payload: NotificationPayload;
  createdAt: Date;
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
