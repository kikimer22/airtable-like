import TableSkeleton from '@/components/table/TableSkeleton';
import { TABLE_CONFIG } from '@/lib/table/tableData';

/**
 * Table loading state component
 */
const TableLoading = () => (
  <div className="container h-[785px] overflow-auto relative">
    <TableSkeleton rows={TABLE_CONFIG.ROWS_ON_VIEW} columns={TABLE_CONFIG.COLUMNS_ON_VIEW}/>
  </div>
);

export default TableLoading;
