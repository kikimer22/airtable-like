import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton loader component for loading states
 */
export const UiSkeleton = ({
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div
    data-slot="skeleton"
    className={cn('bg-accent animate-pulse rounded-md', className)}
    {...props}
  />
);
