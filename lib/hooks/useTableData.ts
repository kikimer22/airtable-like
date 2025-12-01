import { useMemo } from 'react';
import { Cursor, DataTableRow, PageParam, TableResponse } from '@/lib/types';
import type { QueryFunctionContext, UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { TABLE_CONFIG } from '@/lib/constants';

export type UseTableDataResult = UseInfiniteQueryResult<InfiniteData<TableResponse, PageParam>, Error> & {
  flattenedData: DataTableRow[];
  firstPageIndex: number;
  loadedPagesCount: number;
  firstPageCursor: Cursor | null;
};

export const TABLE_QUERY_KEY = ['table'] as const;

const fetchData = async ({ pageParam }: QueryFunctionContext): Promise<TableResponse> => {
  const { cursor, direction } = pageParam as PageParam;
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor.toString());
  params.append('direction', direction);
  params.append('pageSize', TABLE_CONFIG.FETCH_SIZE.toString());

  const response = await fetch(`/api/table?${params}`);
  if (!response.ok) throw new Error(`Failed to fetch table: ${response.status}`);
  return response.json();
};

export const useTableData = (): UseTableDataResult => {
  const infiniteQueryResult = useInfiniteQuery<TableResponse, Error, InfiniteData<TableResponse, PageParam>, typeof TABLE_QUERY_KEY, PageParam>({
    queryKey: TABLE_QUERY_KEY,
    queryFn: fetchData,
    initialPageParam: { cursor: null, direction: 'forward' },
    getNextPageParam: (lastPage) => lastPage.meta.hasNextPage ? { cursor: lastPage.meta.nextCursor, direction: 'forward' } : null,
    getPreviousPageParam: (firstPage) => firstPage?.meta?.hasPrevPage && firstPage?.meta?.prevCursor ? { cursor: firstPage.meta.prevCursor, direction: 'backward' } : null,
    maxPages: TABLE_CONFIG.FETCH_MAX_PAGES,
  });

  const { flattenedData, firstPageIndex, loadedPagesCount, firstPageCursor } = useMemo(() => {
    const pages = infiniteQueryResult?.data?.pages || [];
    const pagesCount = pages.length;
    const maxPages = TABLE_CONFIG.FETCH_MAX_PAGES || 1;
    const firstPageCursor = pages[0]?.meta?.prevCursor;

    let firstIdx = 0;
    let visiblePages = pages;

    if (pagesCount > maxPages) {
      firstIdx = pagesCount - maxPages;
      visiblePages = pages.slice(firstIdx);
    }

    const data = visiblePages.flatMap((page) => page.data);

    return { flattenedData: data, firstPageIndex: firstIdx, loadedPagesCount: pagesCount, firstPageCursor };
  }, [infiniteQueryResult?.data?.pages]);

  return { ...infiniteQueryResult, flattenedData, firstPageIndex, loadedPagesCount, firstPageCursor };
};
