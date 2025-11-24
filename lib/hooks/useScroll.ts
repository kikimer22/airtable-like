import { useRef, useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import { TABLE_CONFIG } from '@/lib/table/tableData';

interface InfiniteScrollOptions {
  threshold?: number;
  enabled?: boolean;
  direction?: 'up' | 'down';
  containerRef?: RefObject<HTMLDivElement | null>;
}

export const useInfiniteScroll = (
  fetchMore: () => void,
  options: InfiniteScrollOptions = {}
) => {
  const {
    threshold = TABLE_CONFIG.FETCH_THRESHOLD,
    enabled = true,
    direction = 'down',
    containerRef: externalContainerRef,
  } = options;
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useMemo(
    () => externalContainerRef ?? internalContainerRef,
    [externalContainerRef]
  );
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current || !sentinelRef.current) return;

    const rootMargin =
      direction === 'down'
        ? `0px 0px ${TABLE_CONFIG.FETCH_ROOT_MARGIN}px 0px`
        : `${TABLE_CONFIG.FETCH_ROOT_MARGIN}px 0px 0px 0px`;

    const observerOptions: IntersectionObserverInit = {
      root: containerRef.current,
      rootMargin,
      threshold,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        fetchMore();
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, observerOptions);
    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchMore, threshold, enabled, containerRef, direction]);

  return { containerRef, sentinelRef };
};

/**
 * Hook for calculating virtual padding for virtualized columns
 */
export const useVirtualPadding = (
  virtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement> | null
) => {
  const virtualItems = virtualizer?.getVirtualItems();

  if (!virtualizer || !virtualItems?.length) {
    return { paddingLeft: undefined, paddingRight: undefined };
  }

  const paddingLeft = virtualItems[0]?.start ?? 0;
  const paddingRight =
    virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0);

  return { paddingLeft, paddingRight };
};
