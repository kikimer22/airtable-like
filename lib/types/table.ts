import type { MockDataTable } from '@/lib/generated/prisma/client';

export type MockDataRow = MockDataTable;

export type MockDataApiResponse = {
  data: MockDataRow[];
  meta: {
    totalRowCount: number;
  };
};


