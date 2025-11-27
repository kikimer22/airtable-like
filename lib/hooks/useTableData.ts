import { useMemo } from 'react';
import type { Cursor, DataTableRow, PaginationResponse } from '@/lib/types';
import type { QueryFunctionContext, UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { TABLE_CONFIG } from '@/lib/constants';

type Response = PaginationResponse<DataTableRow>;

interface PageParam {
  cursor: Cursor;
  direction: 'forward' | 'backward';
}

export type UseTableDataResult = UseInfiniteQueryResult<InfiniteData<Response, PageParam>, Error> & {
  flattenedData: DataTableRow[];
  firstPageIndex: number;
  loadedPagesCount: number;
  firstPageCursor: Cursor | null;
};

const fetchData = async ({ pageParam }: QueryFunctionContext): Promise<Response> => {
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

export const useTableData = (): UseTableDataResult => {
  const infiniteQueryResult = useInfiniteQuery<Response, Error, InfiniteData<Response, PageParam>, string[], PageParam>({
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

    return {
      flattenedData: data,
      firstPageIndex: firstIdx,
      loadedPagesCount: pagesCount,
      firstPageCursor
    };
  }, [infiniteQueryResult?.data?.pages]);

  return {
    ...infiniteQueryResult,
    flattenedData,
    firstPageIndex,
    loadedPagesCount,
    firstPageCursor
  };
};
