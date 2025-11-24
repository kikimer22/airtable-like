import type { MockDataTable } from '@/lib/generated/prisma/client';

export type MockDataRow = MockDataTable;

export type MockDataApiResponse = {
  data: MockDataRow[];
  meta: {
    totalRowCount: number;
  };
};

export type MockDataEditsMap = Record<number, Partial<MockDataRow>>;

export type MockDataUpdateEntry = {
  id: number;
  data: Partial<MockDataRow>;
};

export type MockDataUpdatePayload = MockDataUpdateEntry[];



