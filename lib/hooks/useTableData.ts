import { useMemo } from 'react';
import type { Cursor, DataTableRow, PageParam, TableResponse } from '@/lib/types';
import type { QueryFunctionContext, UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { TABLE_CONFIG } from '@/lib/constants';

export type UseTableDataResult = UseInfiniteQueryResult<InfiniteData<TableResponse, PageParam>, Error> & {
  flattenedData: DataTableRow[];
  loadedPagesCount: number;
  firstPageCursor: Cursor | null;
  lastPageCursor: Cursor | null;
};

export const TABLE_QUERY_KEY = ['table'] as const;

const maxPages = TABLE_CONFIG.FETCH_MAX_PAGES || 1;

const fetchData = async ({ pageParam }: QueryFunctionContext): Promise<TableResponse> => {
  const { cursor, direction } = pageParam as PageParam ?? {};
  const params = new URLSearchParams({
    limit: TABLE_CONFIG.FETCH_SIZE.toString(),
    ...(cursor ? { cursor: cursor.toString() } : {}),
    ...(direction ? { direction } : {}),
  });
  const response = await fetch(`/api/table?${params}`);
  if (!response.ok) throw new Error(`Failed to fetch table: ${response.status}`);
  return response.json();
};

export const useTableData = (): UseTableDataResult => {
  const infiniteQueryResult = useInfiniteQuery<TableResponse, Error, InfiniteData<TableResponse, PageParam>, typeof TABLE_QUERY_KEY, PageParam>({
    queryKey: TABLE_QUERY_KEY,
    queryFn: fetchData,
    initialPageParam: { cursor: null, direction: 'forward' },
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ? {
      cursor: lastPage.meta.nextCursor,
      direction: 'forward'
    } : null,
    getPreviousPageParam: (firstPage) => firstPage.meta.prevCursor ? {
      cursor: firstPage.meta.prevCursor,
      direction: 'backward'
    } : null,
    maxPages
  });

  const { flattenedData, loadedPagesCount, firstPageCursor, lastPageCursor } = useMemo(() => {
    const pages = infiniteQueryResult?.data?.pages || [];
    const loadedPagesCount = pages.length;
    const firstPageCursor = pages[0]?.meta?.prevCursor ?? null;
    const lastPageCursor = pages[pages.length - 1]?.meta?.nextCursor ?? null;
    const flattenedData = pages.flatMap((page) => page.data);
    return {
      flattenedData,
      loadedPagesCount,
      firstPageCursor,
      lastPageCursor
    };
  }, [infiniteQueryResult?.data?.pages]);

  return { ...infiniteQueryResult, flattenedData, loadedPagesCount, firstPageCursor, lastPageCursor };
};
