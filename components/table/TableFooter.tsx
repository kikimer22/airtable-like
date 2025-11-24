interface TableFooterProps {
  isFetching: boolean;
}

/**
 * Table footer with loading indicator
 */
const TableFooter = ({ isFetching }: TableFooterProps) => {
  if (!isFetching) return null;

  return (
    <div className="absolute bottom-0 bg-secondary flex items-center justify-center p-6 border-1 rounded-lg shadow-md">
      <div className="flex gap-2 items-center">
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"/>
        <span className="text-xl text-gray-600">Fetching more data...</span>
      </div>
    </div>
  );
};

export default TableFooter;
