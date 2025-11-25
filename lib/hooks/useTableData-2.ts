import { useInfiniteQuery } from '@tanstack/react-query';
import type { PaginationResponse } from '@/app/api/table/route';
import { TABLE_CONFIG } from '@/lib/table/tableData';
import { useMemo } from 'react';

const fetchData = async (cursor?: string | null): Promise<PaginationResponse<unknown>> => {
  console.log('Fetching data with cursor:', cursor);
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('pageSize', TABLE_CONFIG.FETCH_SIZE.toString());

  const response = await fetch(`/api/table?${params}`);
  if (!response.ok) throw new Error('Failed to fetch data');
  return await response.json() as Promise<PaginationResponse<unknown>>;
};

export const useTableData = () => {
  const infiniteQueryResult = useInfiniteQuery<PaginationResponse<unknown>, Error>({
    queryKey: ['table'],
    queryFn: ({ pageParam }) => fetchData(pageParam as string | undefined),
    initialPageParam: null,
    getPreviousPageParam: (firstPage) => firstPage.previousId ?? undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : null,
    maxPages: 3,
  });

  const flattenedData = useMemo(() => {
    return infiniteQueryResult?.data?.pages.flatMap(page => page.data) || [];
  }, [infiniteQueryResult?.data?.pages]);

  return {
    ...infiniteQueryResult,
    flattenedData
  };
};
