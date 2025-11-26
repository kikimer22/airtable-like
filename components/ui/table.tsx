'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Main old-schemas container component
 */
function UiTable({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div data-slot="table-container" className="relative">
      <table
        data-slot="table"
        className={cn('grid w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

/**
 * Table header wrapper component
 */
function UiTableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('sticky -top-0 z-1 grid [&_tr]:border-b', className)}
      {...props}
    />
  );
}

/**
 * Table body wrapper component
 */
function UiTableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('relative grid [&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

/**
 * Table footer wrapper component
 */
function UiTableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  );
}

/**
 * Table row component
 */
function UiTableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'flex w-full hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        className
      )}
      {...props}
    />
  );
}

/**
 * Table header cell component
 */
function UiTableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'flex text-foreground min-h-9 p-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  );
}

/**
 * Table data cell component
 */
function UiTableCell({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'flex items-center p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  );
}

/**
 * Table caption component
 */
function UiTableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  );
}

export {
  UiTable,
  UiTableHeader,
  UiTableBody,
  UiTableFooter,
  UiTableHead,
  UiTableRow,
  UiTableCell,
  UiTableCaption,
};
