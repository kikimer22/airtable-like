import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { CellChange, CellKey, OriginalValues } from '@/lib/types';

type State = {
  pendingChanges: Map<string, CellChange>;
  originalValues: Map<string, OriginalValues>;
  cellStates: Map<string, unknown>;
  changesCount: number;
  cancelledCells: Set<string>;
};

type Actions = {
  registerChange: (change: CellChange) => void;
  getCellState: (key: CellKey) => unknown;
  setCellState: (change: OriginalValues) => void;
  clearCellState: (key: CellKey) => void;
  getPendingChanges: () => Array<CellChange>;
  getOriginalValue: (key: CellKey) => unknown;
  clearAll: () => void;
  isCellModified: (key: CellKey) => boolean;
  isCellCancelled: (key: CellKey) => boolean;
  acknowledgeCancelledCell: (key: CellKey) => void;
};

export const keyOf = ({ rowId, columnId }: CellKey) => `${rowId}-${columnId}`;

const useOptimisticUpdatesStore = create<State & Actions>((set, get) => ({
  pendingChanges: new Map(),
  originalValues: new Map(),
  cellStates: new Map(),
  changesCount: 0,
  cancelledCells: new Set(),

  registerChange: ({ rowId, columnId, newValue, oldValue }) => {
    set((state) => {
      const newState = { ...state };
      const key = keyOf({ rowId, columnId });

      if (!newState.originalValues.has(key)) {
        const newMap = new Map(newState.originalValues);
        newMap.set(key, { rowId, columnId, value: oldValue });
        newState.originalValues = newMap;
      }

      const newPendingChanges = new Map(newState.pendingChanges);
      if (oldValue === newValue) {
        newPendingChanges.delete(key);
      } else {
        newPendingChanges.set(key, { rowId, columnId, newValue });
      }

      newState.pendingChanges = newPendingChanges;
      newState.changesCount = newPendingChanges.size;

      const newCancelledCells = new Set(newState.cancelledCells);
      newCancelledCells.delete(key);
      newState.cancelledCells = newCancelledCells;

      return newState;
    });
  },

  getCellState: ({ rowId, columnId }) => {
    const key = keyOf({ rowId, columnId });
    return get().cellStates.get(key);
  },

  setCellState: ({ rowId, columnId, value }) => {
    set((state_) => {
      const newMap = new Map(state_.cellStates);
      const key = keyOf({ rowId, columnId });
      newMap.set(key, value);
      return { cellStates: newMap };
    });
  },

  clearCellState: ({ rowId, columnId }) => {
    set((state) => {
      const newMap = new Map(state.cellStates);
      const key = keyOf({ rowId, columnId });
      newMap.delete(key);
      return { cellStates: newMap };
    });
  },

  getPendingChanges: () => {
    return Array.from(get().pendingChanges.values());
  },

  getOriginalValue: ({ rowId, columnId }) => {
    const key = keyOf({ rowId, columnId });
    return get().originalValues.get(key)?.value;
  },

  isCellModified: ({ rowId, columnId }) => {
    const key = keyOf({ rowId, columnId });
    return get().pendingChanges.has(key);
  },

  isCellCancelled: ({ rowId, columnId }) => {
    const key = keyOf({ rowId, columnId });
    return get().cancelledCells.has(key);
  },

  acknowledgeCancelledCell: ({ rowId, columnId }) => {
    set((state) => {
      const newCancelledCells = new Set(state.cancelledCells);
      const key = keyOf({ rowId, columnId });
      newCancelledCells.delete(key);
      return { cancelledCells: newCancelledCells };
    });
  },

  clearAll: () => {
    set({
      pendingChanges: new Map(),
      originalValues: new Map(),
      cellStates: new Map(),
      changesCount: 0,
      cancelledCells: new Set(Array.from(get().pendingChanges.keys())),
    });
  },
}));

export const useSelectorOptimisticUpdates = () => useOptimisticUpdatesStore(useShallow(({
  registerChange,
  getCellState,
  setCellState,
  clearCellState,
  getPendingChanges,
  isCellModified,
  clearAll,
  changesCount,
}) => ({
  registerChange,
  getCellState,
  setCellState,
  clearCellState,
  getPendingChanges,
  isCellModified,
  clearAll,
  changesCount,
})));

export const useSelectorEditableCell = () => useOptimisticUpdatesStore(useShallow(({
  registerChange,
  getCellState,
  setCellState,
  clearCellState,
  isCellModified,
  isCellCancelled,
  acknowledgeCancelledCell,
  getOriginalValue,
}) => ({
  registerChange,
  getCellState,
  setCellState,
  clearCellState,
  isCellModified,
  isCellCancelled,
  acknowledgeCancelledCell,
  getOriginalValue,
})));
