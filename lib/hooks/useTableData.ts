import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { fetchTablePage } from '@/lib/api/tableData';
import type { MockDataRow } from '@/lib/types/table';

const PAGE_WINDOW = 2;

const buildWindowPages = (center: number, total: number) => {
  const start = Math.max(0, center - PAGE_WINDOW);
  const end = Math.min(Math.max(total - 1, 0), center + PAGE_WINDOW);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (!pages.length) return [Math.max(Math.min(center, total - 1), 0)];
  return pages;
};

type PageSegment = {
  page: number;
  rows: MockDataRow[];
};

export const useTableData = (sorting: SortingState, requestedPage: number, pageSize: number) => {
  const sortingKey = JSON.stringify(sorting);
  const baseQueryKey = useMemo(() => ['table-data', sortingKey] as const, [sortingKey]);
  const queryClient = useQueryClient();
  const previousSortingRef = useRef<string>(sortingKey);
  const [cachedState, setCachedState] = useState<{ segments: PageSegment[]; pages: number[] }>({
    segments: [],
    pages: [],
  });

  const fallbackTotalPages = Math.max(requestedPage + PAGE_WINDOW + 1, 1);
  const [effectivePage, totalPages] = useMemo(() => {
    const normalizedPage = requestedPage < 0 ? 0 : requestedPage;
    const maxIndex = Math.max(fallbackTotalPages - 1, 0);
    const clamped = Math.min(normalizedPage, maxIndex);
    return [clamped, fallbackTotalPages] as const;
  }, [requestedPage, fallbackTotalPages]);

  const windowPages = useMemo(
    () => buildWindowPages(effectivePage, totalPages),
    [effectivePage, totalPages],
  );

  const pageQueries = useQueries({
    queries: windowPages.map((page) => ({
      queryKey: [...baseQueryKey, page] as const,
      queryFn: () => fetchTablePage(page, sorting),
      staleTime: 60_000,
      gcTime: 60_000,
    })),
  });

  useEffect(() => {
    if (sortingKey !== previousSortingRef.current) {
      previousSortingRef.current = sortingKey;
      queryClient.removeQueries({ queryKey: baseQueryKey, exact: false });
    }
  }, [sortingKey, baseQueryKey, queryClient]);

  const pageDataMap = useMemo(() => {
    const map = new Map<number, MockDataRow[]>();
    windowPages.forEach((page, index) => {
      const rows = pageQueries[index]?.data?.data;
      if (rows) {
        map.set(page, rows);
      }
    });
    return map;
  }, [windowPages, pageQueries]);

  const anyData = pageQueries.find((query) => query.data);
  const totalRowCount = anyData?.data?.meta?.totalRowCount ?? 0;
  const derivedTotalPages =
    totalRowCount > 0 ? Math.max(1, Math.ceil(totalRowCount / pageSize)) : totalPages;

  const adjustedPage = Math.min(effectivePage, Math.max(derivedTotalPages - 1, 0));
  const adjustedWindowPages = useMemo(
    () => buildWindowPages(adjustedPage, derivedTotalPages),
    [adjustedPage, derivedTotalPages],
  );

  const combinedSegments: PageSegment[] = useMemo(() => {
    return adjustedWindowPages.map((page) => ({
      page,
      rows: pageDataMap.get(page) ?? [],
    }));
  }, [adjustedWindowPages, pageDataMap]);

  const windowReady = adjustedWindowPages.every((page) => pageDataMap.has(page));

  useEffect(() => {
    if (!windowReady) return;
    startTransition(() => {
      setCachedState({
        segments: combinedSegments,
        pages: adjustedWindowPages,
      });
    });
  }, [windowReady, combinedSegments, adjustedWindowPages]);

  useEffect(() => {
    if (!windowReady) return;
    const allowed = new Set(adjustedWindowPages);
    queryClient
      .getQueryCache()
      .findAll({ queryKey: baseQueryKey, exact: false })
      .forEach((cachedQuery) => {
        const [, , cachedPage] = cachedQuery.queryKey as [string, string, number];
        if (typeof cachedPage !== 'number') return;
        if (!allowed.has(cachedPage)) {
          queryClient.removeQueries({ queryKey: cachedQuery.queryKey, exact: true });
        }
      });
  }, [windowReady, adjustedWindowPages, baseQueryKey, queryClient]);

  const displaySegments =
    windowReady || cachedState.segments.length === 0 ? combinedSegments : cachedState.segments;

  const displayWindowPages =
    windowReady || cachedState.pages.length === 0 ? adjustedWindowPages : cachedState.pages;

  const adjustedFlatData = useMemo(
    () => displaySegments.flatMap((segment) => segment.rows),
    [displaySegments],
  );

  const isInitialLoading =
    pageQueries.length === 0 || pageQueries.every((query) => query.isLoading && !query.data);
  const isFetching = pageQueries.some((query) => query.isFetching);

  return {
    flatData: adjustedFlatData,
    segments: displaySegments,
    totalRowCount,
    totalPages: derivedTotalPages,
    currentPage: adjustedPage,
    windowPages: displayWindowPages,
    isLoading: isInitialLoading,
    isFetching,
    baseQueryKey,
    pageSize,
  };
};

