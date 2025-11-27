'use client';

import type { Table } from '@tanstack/react-table';
import type { MockDataRow } from '@/lib/types';
import { toDisplayValue } from '@/lib/utils';
import type { TableFieldKind } from '@/lib/helpers/columnsCreator';

interface DefaultCellProps {
  kind: TableFieldKind;
  value: unknown;
  rowIndex: number;
  columnId: string;
  table: Table<MockDataRow>;
}

const DefaultCell = ({ kind, value, rowIndex, columnId }: DefaultCellProps) => {
  return (
    <div id={`default-cell-${rowIndex}-${columnId}`}>
      {toDisplayValue(value)}
    </div>
  );
};

export default DefaultCell;
