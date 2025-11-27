'use client';

import type { Table } from '@tanstack/react-table';
import type { DataTableRow } from '@/lib/types';
import { toDisplayValue } from '@/lib/utils';
import type { TableFieldKind } from '@/lib/helpers/columnsCreator';

interface DefaultCellProps {
  kind: TableFieldKind;
  value: unknown;
  rowIndex: number;
  columnId: string;
}

const DefaultCell = ({ kind, value, rowIndex, columnId }: DefaultCellProps) => {
  return (
    <div id={`default-cell-${rowIndex}-${columnId}`}>
      {toDisplayValue(value)}
    </div>
  );
};

export default DefaultCell;
