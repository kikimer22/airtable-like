import { useMemo, useState, useEffect } from 'react';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  cachedPages: number[];
  onPageChange: (page: number) => void;
}

const clampPage = (value: number, total: number) => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > total - 1) return Math.max(total - 1, 0);
  return value;
};

const buildPageSequence = (page: number, totalPages: number, cachedPages: number[]) => {
  const indices = new Set<number>();
  indices.add(0);
  indices.add(totalPages - 1);
  cachedPages.forEach((value) => indices.add(value));
  indices.add(page);

  const sorted = Array.from(indices)
    .filter((value) => value >= 0 && value < totalPages)
    .sort((a, b) => a - b);

  const output: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];
    if (i > 0 && current - (prev ?? 0) > 1) {
      output.push('ellipsis');
    }
    output.push(current);
  }
  return output;
};

const TablePagination = ({ page, totalPages, cachedPages, onPageChange }: TablePaginationProps) => {
  const safeTotalPages = Math.max(totalPages, 1);
  const safePage = clampPage(page, safeTotalPages);
  const displayPage = safePage + 1;
  const pageItems = useMemo(
    () => buildPageSequence(safePage, safeTotalPages, cachedPages),
    [safePage, safeTotalPages, cachedPages],
  );

  const [inputValue, setInputValue] = useState<string>(() => String(displayPage));

  useEffect(() => {
    setInputValue(String(displayPage));
  }, [displayPage]);

  const handlePageSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericValue = clampPage(Number(inputValue) - 1, safeTotalPages);
    if (!Number.isNaN(numericValue)) {
      onPageChange(numericValue);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Сторінка {displayPage} із {totalPages}
        </div>
        <form className="flex items-center gap-2" onSubmit={handlePageSubmit}>
          <input
            id="page-input"
            type="number"
            min={1}
            max={safeTotalPages}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="w-20 border rounded px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="px-3 py-1 text-sm border border-gray-400 rounded hover:bg-gray-100"
          >
            Перейти
          </button>
        </form>
      </div>
      <div className="flex items-center flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="px-2 py-1 text-sm border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          « Перша
        </button>
        <button
          type="button"
          onClick={() => onPageChange(clampPage(safePage - 1, safeTotalPages))}
          disabled={safePage === 0}
          className="px-2 py-1 text-sm border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ‹ Назад
        </button>
        {pageItems.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`px-3 py-1 text-sm border rounded ${
                item === safePage
                  ? 'border-blue-600 text-white bg-blue-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item + 1}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(clampPage(safePage + 1, safeTotalPages))}
          disabled={safePage >= safeTotalPages - 1}
          className="px-2 py-1 text-sm border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          Вперед ›
        </button>
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages - 1)}
          disabled={safePage >= safeTotalPages - 1}
          className="px-2 py-1 text-sm border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          Остання »
        </button>
      </div>
    </div>
  );
};

export default TablePagination;


