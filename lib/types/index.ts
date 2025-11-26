import type { MockDataTable } from '@/lib/generated/prisma/client';

export type MockDataRow = MockDataTable;

export interface DbUpdateEvent {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: MockDataRow;
  changes?: Record<string, { old: string, new: string }>;
}

export type Cursor = string | null;

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
