import { useState, useEffect, useCallback, useEffectEvent } from 'react';
import { useSelectorEditableCell } from '@/lib/store/optimisticUpdatesStore';

interface UseEditableCellProps {
  rowId: number;
  columnId: string;
  value: unknown;
}

export function useEditableCell({ rowId, columnId, value }: UseEditableCellProps) {
  const {
    registerChange,
    getCellState,
    setCellState,
    clearCellState,
    isCellModified,
    isCellCancelled,
    acknowledgeCancelledCell,
    getOriginalValue,
  } = useSelectorEditableCell();

  const savedState = getCellState({ rowId, columnId });
  const [internalValue, setInternalValue] = useState(savedState ?? value);

  const isModified = isCellModified({ rowId, columnId });
  const isCancelled = isCellCancelled({ rowId, columnId });

  const handleChange = useCallback(
    (newValue: unknown) => {
      setInternalValue(newValue);
      registerChange({ rowId, columnId, oldValue: value, newValue });
    },
    [rowId, columnId, value, registerChange]
  );

  const resetOnCancel = useEffectEvent(() => {
    const originalValue = getOriginalValue({ rowId, columnId });
    setInternalValue(originalValue ?? value);
    clearCellState({ rowId, columnId });
    acknowledgeCancelledCell({ rowId, columnId });
  });

  const persistOnUnmount = useEffectEvent(() => {
    if (!isModified) return;

    if (internalValue !== value) {
      setCellState({ rowId, columnId, value: internalValue });
    } else {
      clearCellState({ rowId, columnId });
    }
  });

  useEffect(() => {
    if (!isCancelled) return;
    resetOnCancel();
  }, [isCancelled]);

  useEffect(() => {
    return () => persistOnUnmount();
  }, []);

  return {
    isModified,
    internalValue,
    handleChange
  };
}
