interface TableFooterProps {
  isFetching: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  errorMessage?: string | null;
}

const TableFooter = ({
  isFetching,
  hasChanges,
  isSaving,
  onSave,
  onReset,
  errorMessage,
}: TableFooterProps) => {
  return (
    <div className="w-full flex flex-col gap-3 items-center">
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2 min-h-[32px]">
          {isFetching ? (
            <>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"/>
              <span className="text-sm text-gray-600">Завантаження нових рядків...</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Всі доступні рядки завантажені</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 text-sm border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
            onClick={onReset}
            disabled={!hasChanges || isSaving}
          >
            Скинути
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm border border-blue-600 rounded text-white bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      </div>
      {errorMessage ? (
        <div className="text-sm text-red-600 self-end">{errorMessage}</div>
      ) : null}
    </div>
  );
};

export default TableFooter;
