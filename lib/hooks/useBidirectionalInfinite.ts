import { type RefObject, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { TABLE_CONFIG } from '@/lib/constants';

interface UseBidirectionalInfiniteProps {
  parentRef: RefObject<HTMLDivElement | null>;
  totalDataLength: number;
  fetchNextPage: () => Promise<unknown>;
  fetchPreviousPage: () => Promise<unknown>;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  hasNextPage: boolean | undefined;
  hasPreviousPage: boolean | undefined;
  loadedPagesCount: number;
  rowHeight?: number;
  pageSize?: number;
  maxPages?: number;
}

export function useBidirectionalInfinite({
  parentRef,
  totalDataLength,
  fetchNextPage,
  fetchPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
  hasNextPage,
  hasPreviousPage,
  loadedPagesCount,
  rowHeight = TABLE_CONFIG.ROW_HEIGHT,
  pageSize = TABLE_CONFIG.FETCH_SIZE,
  maxPages = TABLE_CONFIG.FETCH_MAX_PAGES ?? 1,
}: UseBidirectionalInfiniteProps) {
  const isInitialLoadRef = useRef(true);
  const lastFetchDirectionRef = useRef<'next' | 'prev' | null>(null);
  const fetchCooldownRef = useRef(false);

  const {
    ref: footerRef,
    inView: footerInView,
  } = useInView({ root: parentRef.current ?? null, threshold: TABLE_CONFIG.FETCH_THRESHOLD });

  const {
    ref: headerRef,
    inView: headerInView,
  } = useInView({ root: parentRef.current ?? null, threshold: TABLE_CONFIG.FETCH_THRESHOLD });

  const handleNextPage = useCallback(async () => {
    if (fetchCooldownRef.current || isFetchingNextPage || isFetchingPreviousPage || !hasNextPage) return;

    fetchCooldownRef.current = true;
    lastFetchDirectionRef.current = 'next';
    const el = parentRef.current;

    try {
      const scrollHeightBefore = el?.scrollHeight ?? 0;

      await fetchNextPage();

      const scrollHeightAfter = el?.scrollHeight ?? 0;
      const addedHeight = scrollHeightAfter - scrollHeightBefore;

      if (loadedPagesCount >= maxPages) {
        const removedHeight = pageSize * rowHeight;
        const netScrollDelta = addedHeight - removedHeight;

        if (netScrollDelta !== 0) {
          el?.scrollBy({ top: netScrollDelta, behavior: 'instant' });
        }
      }

    } finally {
      lastFetchDirectionRef.current = null;
      setTimeout(() => {
        fetchCooldownRef.current = false;
      }, 0);
    }
  }, [isFetchingNextPage, isFetchingPreviousPage, hasNextPage, fetchNextPage, parentRef, pageSize, rowHeight, maxPages, loadedPagesCount]);

  const handlePreviousPage = useCallback(async () => {
    if (fetchCooldownRef.current || isFetchingPreviousPage || isFetchingNextPage || !hasPreviousPage) return;

    fetchCooldownRef.current = true;
    lastFetchDirectionRef.current = 'prev';
    const el = parentRef.current;

    try {
      const scrollTopBefore = el?.scrollTop ?? 0;
      const scrollHeightBefore = el?.scrollHeight ?? 0;

      await fetchPreviousPage();

      const scrollHeightAfter = el?.scrollHeight ?? 0;
      const addedHeight = scrollHeightAfter - scrollHeightBefore;

      if (loadedPagesCount < maxPages) {
        const removedHeight = pageSize * rowHeight;
        const netScrollDelta = addedHeight - removedHeight;
        if (el && el.scrollTop !== undefined) {
          el.scrollTop = scrollTopBefore + netScrollDelta;
        }
      } else {
        if (el && el.scrollTop !== undefined) {
          el.scrollTop = scrollTopBefore + addedHeight;
        }
        const removedHeight = pageSize * rowHeight;
        el?.scrollBy({ top: removedHeight, behavior: 'instant' });
      }

    } finally {
      lastFetchDirectionRef.current = null;
      setTimeout(() => {
        fetchCooldownRef.current = false;
      }, 0);
    }
  }, [isFetchingPreviousPage, isFetchingNextPage, hasPreviousPage, fetchPreviousPage, parentRef, pageSize, rowHeight, maxPages, loadedPagesCount]);

  useEffect(() => {
    if (!footerInView || isInitialLoadRef.current || isFetchingNextPage || isFetchingPreviousPage) return;
    void handleNextPage();
  }, [footerInView, handleNextPage, isFetchingNextPage, isFetchingPreviousPage]);

  useEffect(() => {
    if (!headerInView || isInitialLoadRef.current || isFetchingPreviousPage || isFetchingNextPage) return;
    void handlePreviousPage();
  }, [headerInView, handlePreviousPage, isFetchingPreviousPage, isFetchingNextPage]);

  useEffect(() => {
    if (totalDataLength === 0) return;
    isInitialLoadRef.current = false;
  }, [totalDataLength]);

  return { headerRef, footerRef };
}
