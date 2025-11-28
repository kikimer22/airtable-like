'use client';

import { toDisplayValue } from '@/lib/utils';

interface DefaultCellProps {
  value: unknown;
  rowIndex: number;
  columnId: string;
}

const DefaultCell = ({ value, rowIndex, columnId }: DefaultCellProps) => {
  return (
    <div id={`default-cell-${rowIndex}-${columnId}`}>
      {toDisplayValue(value)}
    </div>
  );
};

export default DefaultCell;
