import type { SortingState } from '@tanstack/react-table';
import { TABLE_CONFIG } from '@/lib/table/tableData';
import type { MockDataApiResponse, MockDataUpdatePayload } from '@/lib/types/table';

const jsonHeaders = { 'Content-Type': 'application/json' };

export const fetchTablePage = async (
  pageIndex: number,
  sorting: SortingState,
): Promise<MockDataApiResponse> => {
  const response = await fetch('/api/table-data', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      page: pageIndex,
      pageSize: TABLE_CONFIG.FETCH_SIZE,
      sorting,
    }),
  });

  if (!response.ok) {
    throw new Error('Не вдалося отримати дані таблиці');
  }

  return response.json();
};

export const saveTableChanges = async (changes: MockDataUpdatePayload): Promise<void> => {
  if (!changes.length) return;

  const response = await fetch('/api/table-data/update', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ changes }),
  });

  if (!response.ok) {
    throw new Error('Не вдалося зберегти зміни');
  }
};


