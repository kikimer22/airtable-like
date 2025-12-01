import { type RefObject, useRef, useEffect, useEffectEvent } from 'react';
import { useInView } from 'react-intersection-observer';
import { TABLE_CONFIG } from '@/lib/constants';
import type { Cursor } from '@/lib/types';

interface UseBidirectionalInfiniteProps {
  parentRef: RefObject<HTMLDivElement | null>;
  totalDataLength: number;
  fetchNextPage: () => Promise<unknown>;
  fetchPreviousPage: () => Promise<unknown>;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  loadedPagesCount: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  rowHeight?: number;
  pageSize?: number;
  maxPages?: number;
  // cursors from useTableData to detect whether pagination meta progressed
  firstPageCursor?: Cursor | null;
  lastPageCursor?: Cursor | null;
}

export function useBidirectionalInfinite({
  parentRef,
  totalDataLength,
  fetchNextPage,
  fetchPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
  loadedPagesCount,
  hasNextPage,
  hasPreviousPage,
  rowHeight = TABLE_CONFIG.ROW_HEIGHT,
  pageSize = TABLE_CONFIG.FETCH_SIZE,
  maxPages = TABLE_CONFIG.FETCH_MAX_PAGES ?? 1,
  firstPageCursor = null,
  lastPageCursor = null,
}: UseBidirectionalInfiniteProps) {
  const stateRef = useRef({
    isInitialLoad: true,
    lastDirection: null as 'next' | 'prev' | null,
    cooldown: false,
  });

  const { ref: footerRef, inView: footerInView } = useInView({
    root: parentRef.current ?? null,
    threshold: TABLE_CONFIG.FETCH_THRESHOLD,
    // rootMargin: `0px 0px ${TABLE_CONFIG.FETCH_ROOT_MARGIN}px 0px`,
  });

  const { ref: headerRef, inView: headerInView } = useInView({
    root: parentRef.current ?? null,
    threshold: TABLE_CONFIG.FETCH_THRESHOLD,
    // rootMargin: `${TABLE_CONFIG.FETCH_ROOT_MARGIN}px 0px 0px 0px`,
  });

  const fetchPage = useEffectEvent(
    async (direction: 'next' | 'prev') => {
      const el = parentRef.current;
      if (!el) return;

      const { cooldown } = stateRef.current;
      if (cooldown || isFetchingNextPage || isFetchingPreviousPage) return;

      const isNext = direction === 'next';

      if (!isNext) {
        if (stateRef.current.isInitialLoad) return;
        if (loadedPagesCount <= 1 || !firstPageCursor || firstPageCursor === '1' || firstPageCursor === lastPageCursor) return;
      }

      if ((isNext && !hasNextPage) || (!isNext && !hasPreviousPage)) return;

      stateRef.current.cooldown = true;
      stateRef.current.lastDirection = direction;

      try {
        const scrollTopBefore = el.scrollTop ?? 0;
        const scrollHeightBefore = el.scrollHeight ?? 0;

        await (isNext ? fetchNextPage() : fetchPreviousPage());

        const scrollHeightAfter = el.scrollHeight ?? 0;
        const addedHeight = scrollHeightAfter - scrollHeightBefore;
        const removedHeight = pageSize * rowHeight;

        if (isNext) {
          if (loadedPagesCount >= maxPages) {
            el.scrollBy({ top: addedHeight - removedHeight, behavior: 'instant' });
          }
        } else {
          if (loadedPagesCount < maxPages) {
            el.scrollTop = scrollTopBefore + (addedHeight - removedHeight);
          } else {
            el.scrollTop = scrollTopBefore + addedHeight;
            el.scrollBy({ top: removedHeight, behavior: 'instant' });
          }
        }
      } finally {
        stateRef.current.lastDirection = null;
        queueMicrotask(() => {
          stateRef.current.cooldown = false;
        });
      }
    }
  );

  useEffect(() => {
    if (!footerInView || stateRef.current.isInitialLoad) return;
    void fetchPage('next');
  }, [footerInView]);

  useEffect(() => {
    if (!headerInView || stateRef.current.isInitialLoad) return;
    void fetchPage('prev');
  }, [headerInView]);

  useEffect(() => {
    if (totalDataLength > 0) {
      stateRef.current.isInitialLoad = false;
    }
  }, [totalDataLength]);

  return { headerRef, footerRef };
}
