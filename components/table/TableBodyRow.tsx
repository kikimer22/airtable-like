import type { Row } from '@tanstack/react-table';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { UiTableRow, UiTableCell } from '@/components/ui/table';
import TableBodyCell from './TableBodyCell';
import type { MockDataRow } from '@/lib/types/table';

interface TableBodyRowProps {
  row: Row<MockDataRow>;
  virtualRow: VirtualItem;
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
}

/**
 * Table body row component with virtual scrolling support
 */
const TableBodyRow = ({
  row,
  virtualRow,
  columnVirtualizer,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
}: TableBodyRowProps) => {
  const visibleCells = row.getVisibleCells();
  const virtualColumns = columnVirtualizer.getVirtualItems();

  const refCallback = (node: HTMLTableRowElement | null) => {
    if (!node) return;
    return rowVirtualizer.measureElement(node);
  };

  return (
    <UiTableRow
      data-index={virtualRow.index}
      ref={refCallback}
      key={row.id}
      className="absolute will-change-transform"
      style={{ transform: `translateY(${virtualRow.start}px)` }}
    >
      {virtualPaddingLeft ? (
        <UiTableCell style={{ width: virtualPaddingLeft }}/>
      ) : null}
      {virtualColumns.map((vc) => {
        const cell = visibleCells[vc.index];
        return <TableBodyCell key={cell.id} cell={cell}/>;
      })}
      {virtualPaddingRight ? (
        <UiTableCell style={{ width: virtualPaddingRight }}/>
      ) : null}
    </UiTableRow>
  );
};

export default TableBodyRow;
