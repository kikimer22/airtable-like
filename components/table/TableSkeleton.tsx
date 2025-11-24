import {
  UiTable,
  UiTableHeader,
  UiTableBody,
  UiTableHead,
  UiTableRow,
  UiTableCell,
} from '@/components/ui/table';
import { UiSkeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows: number;
  columns: number;
}

/**
 * Skeleton loading component for table
 */
const TableSkeleton = ({ rows, columns }: TableSkeletonProps) => (
  <UiTable>
    <UiTableHeader>
      <UiTableRow>
        {Array.from({ length: columns }).map((_, columnIndex) => (
          <UiTableHead key={columnIndex} className="bg-secondary w-full">
            <UiSkeleton className="h-5 w-full"/>
          </UiTableHead>
        ))}
      </UiTableRow>
    </UiTableHeader>
    <UiTableBody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <UiTableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <UiTableCell key={columnIndex} className="w-full">
              <UiSkeleton className="h-5 w-full"/>
            </UiTableCell>
          ))}
        </UiTableRow>
      ))}
    </UiTableBody>
  </UiTable>
);

export default TableSkeleton;
