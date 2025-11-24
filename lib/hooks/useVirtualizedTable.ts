import type { RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ColumnDef, OnChangeFn, SortingState, TableMeta } from '@tanstack/react-table';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { TABLE_CONFIG } from '@/lib/table/tableData';
import type { MockDataRow } from '@/lib/types/table';

interface TableMetaWithUpdate extends TableMeta<MockDataRow> {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  isSaving?: boolean;
}

interface UseVirtualizedTableOptions {
  data: MockDataRow[];
  columns: ColumnDef<MockDataRow>[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  containerRef?: RefObject<HTMLDivElement | null>;
  onUpdateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  isSaving?: boolean;
}

export const useVirtualizedTable = ({
  data,
  columns,
  sorting,
  onSortingChange,
  containerRef,
  onUpdateData,
  isSaving = false,
}: UseVirtualizedTableOptions) => {
  const table = useReactTable<MockDataRow>({
    data,
    columns,
    state: { sorting },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    onSortingChange,
    meta: {
      updateData: onUpdateData,
      isSaving,
    } as TableMetaWithUpdate,
  });

  const { rows } = table.getRowModel();
  const visibleColumns = table.getVisibleLeafColumns();

  const columnVirtualizer = useVirtualizer<
    HTMLDivElement,
    HTMLTableCellElement
  >({
    count: visibleColumns.length,
    estimateSize: (index) => visibleColumns[index]?.getSize?.() ?? 100,
    getScrollElement: () => containerRef?.current ?? null,
    horizontal: true,
    overscan: 3,
  });

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => TABLE_CONFIG.ROW_HEIGHT,
    getScrollElement: () => containerRef?.current ?? null,
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return {
    table,
    rows,
    columnVirtualizer,
    rowVirtualizer,
  };
};

