import { useMemo, useRef, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { TABLE_CONFIG } from '@/mock/tableData';
import type { MockDataApiResponse } from '@/lib/types/table';

const fetchTablePage = async (
  pageIndex: number,
  sorting: SortingState,
): Promise<MockDataApiResponse> => {
  const response = await fetch('/api/mock-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export const useTableData = (sorting: SortingState) => {
  const sortingKey = JSON.stringify(sorting);
  const previousSortingRef = useRef<string>(sortingKey);

  const query = useInfiniteQuery<MockDataApiResponse>({
    queryKey: ['mock-data', sortingKey],
    queryFn: ({ pageParam = 0 }) => fetchTablePage(pageParam as number, sorting),
    initialPageParam: 0,
    getNextPageParam: (_lastGroup, groups) => groups.length,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (sortingKey !== previousSortingRef.current) {
      previousSortingRef.current = sortingKey;
      query.refetch();
    }
  }, [sortingKey, query]);

  const flatData = useMemo(
    () => query.data?.pages?.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const totalRowCount = query.data?.pages?.[0]?.meta?.totalRowCount ?? 0;

  return {
    ...query,
    flatData,
    totalRowCount,
    totalFetched: flatData.length,
  };
};

