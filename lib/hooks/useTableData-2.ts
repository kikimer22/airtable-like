import type { Cursor, PaginationResponse } from '@/app/api/table/route';
import { TABLE_CONFIG } from '@/lib/table/tableData';
import { useMemo } from 'react';
import type { MockDataRow } from '@/lib/types/table';
import type { QueryFunctionContext } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

type Response = PaginationResponse<MockDataRow>;

interface PageParam {
  cursor: Cursor;
  direction: 'forward' | 'backward';
}

const fetchData = async (
  { pageParam }: QueryFunctionContext,
): Promise<Response> => {
  const { cursor, direction } = pageParam as PageParam;
  const params = new URLSearchParams();
  if (!!cursor) params.append('cursor', cursor.toString());
  params.append('direction', direction.toString());
  params.append('pageSize', TABLE_CONFIG.FETCH_SIZE.toString());

  const response = await fetch(`/api/table?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status}`);
  }
  return response.json();
};

export const useTableData = () => {
  const infiniteQueryResult = useInfiniteQuery({
    queryKey: ['table'],
    queryFn: (p: QueryFunctionContext) => fetchData(p),
    initialPageParam: {
      cursor: null,
      direction: 'forward',
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta.hasNextPage) return null;
      return {
        cursor: lastPage.meta.nextCursor,
        direction: 'forward',
      };
    },
    getPreviousPageParam: (firstPage) => {
      if (!firstPage?.meta?.hasPrevPage) return null;
      const prevCursor = firstPage.meta.prevCursor;
      if (prevCursor == null) return null;
      return {
        cursor: prevCursor,
        direction: 'backward',
      };
    },
    maxPages: TABLE_CONFIG.FETCH_MAX_PAGES,
  });

  const flattenedData = useMemo(() => {
    return infiniteQueryResult?.data?.pages.flatMap((page) => page.data) || [];
  }, [infiniteQueryResult?.data?.pages]);

  return {
    ...infiniteQueryResult,
    flattenedData,
  };
};
