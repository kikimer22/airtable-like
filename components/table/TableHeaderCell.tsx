import type { Header } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { UiTableHead } from '@/components/ui/table';
import { getSortIcon } from '@/lib/helpers';
import type { MockDataRow } from '@/lib/types/table';

interface TableHeaderCellProps {
  header: Header<MockDataRow, unknown>;
}

/**
 * Table header cell component with sorting support
 */
const TableHeaderCell = ({ header }: TableHeaderCellProps) => {
  const canSort = header.column.getCanSort();
  const sortingState = header.column.getIsSorted() as 'asc' | 'desc' | null;
  const sortIcon = getSortIcon(sortingState);
  const toggleSortingHandler = header.column.getToggleSortingHandler();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (canSort && toggleSortingHandler) {
      e.preventDefault();
      e.stopPropagation();
      toggleSortingHandler(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (canSort && toggleSortingHandler && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      toggleSortingHandler(e);
    }
  };

  return (
    <UiTableHead
      key={header.id}
      className="bg-secondary"
      style={{ width: header.getSize() }}
    >
      <div
        className={`flex items-center gap-1 text-primary ${canSort ? 'cursor-pointer select-none' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={canSort ? 'button' : undefined}
        tabIndex={canSort ? 0 : undefined}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {sortIcon && <span aria-label={`Sort ${sortingState}`}>{sortIcon}</span>}
      </div>
    </UiTableHead>
  );
};

export default TableHeaderCell;
