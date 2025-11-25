import TableSkeleton from '@/components/Table-2/TableSkeleton';
import { TABLE_CONFIG } from '@/lib/table/tableData';

const TableLoading = () => (
  <div className="container h-[785px] overflow-auto relative">
    <TableSkeleton rows={TABLE_CONFIG.ROWS_ON_VIEW} columns={TABLE_CONFIG.COLUMNS_ON_VIEW}/>
  </div>
);

export default TableLoading;
