import type { RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TABLE_CONFIG } from '@/lib/constants';
import type { Table } from '@tanstack/react-table';
import type { DataTableRow } from '@/lib/types';

interface UseVirtualColumnProps {
  table: Table<DataTableRow>;
  tableContainerRef: RefObject<HTMLDivElement | null>;
}

export const useVirtualColumn = ({ table, tableContainerRef }: UseVirtualColumnProps) => {
  const visibleColumns = table.getVisibleLeafColumns();
  const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    count: visibleColumns.length,
    estimateSize: index => visibleColumns[index].getSize(),
    getScrollElement: () => tableContainerRef.current,
    overscan: TABLE_CONFIG.COLUMNS_OVERSCAN,
    horizontal: true,
  });
  const virtualColumns = columnVirtualizer.getVirtualItems();
  let virtualPaddingLeft: number | undefined;
  let virtualPaddingRight: number | undefined;
  if (columnVirtualizer && virtualColumns?.length) {
    virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
    virtualPaddingRight = columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
  }
  return { columnVirtualizer, virtualPaddingLeft, virtualPaddingRight };
};
