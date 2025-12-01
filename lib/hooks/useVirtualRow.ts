import type { RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TABLE_CONFIG } from '@/lib/constants';
import type { Table } from '@tanstack/react-table';
import type { DataTableRow } from '@/lib/types';

interface UseVirtualRowProps {
  table: Table<DataTableRow>;
  tableContainerRef: RefObject<HTMLDivElement | null>;
}

export const useVirtualRow = ({ table, tableContainerRef }: UseVirtualRowProps) => {
  const { rows } = table.getRowModel();
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => TABLE_CONFIG.ROW_HEIGHT,
    getScrollElement: () => tableContainerRef.current,
    overscan: TABLE_CONFIG.ROWS_OVERSCAN,
    // TODO: Enable dynamic row height measurement
    // measureElement:
    //   typeof window !== 'undefined' &&
    //   navigator.userAgent.indexOf('Firefox') === -1
    //     ? element => element?.getBoundingClientRect().height
    //     : undefined,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  return { rows, rowVirtualizer, virtualRows };
};
