import { useRef, useEffect } from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import { TABLE_CONFIG } from '@/mock/tableData';

interface InfiniteScrollOptions {
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook for infinite scroll using IntersectionObserver
 */
export const useInfiniteScroll = (
  fetchMore: () => void,
  options: InfiniteScrollOptions = {}
) => {
  const { threshold = TABLE_CONFIG.FETCH_THRESHOLD, enabled = true } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current || !sentinelRef.current) return;

    const observerOptions: IntersectionObserverInit = {
      root: containerRef.current,
      rootMargin: `${TABLE_CONFIG.FETCH_ROOT_MARGIN}px`,
      threshold,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          fetchMore();
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, observerOptions);
    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchMore, threshold, enabled]);

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
