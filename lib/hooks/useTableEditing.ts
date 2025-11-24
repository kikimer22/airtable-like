import { useState, useCallback, useMemo } from 'react';
import type { MockDataRow } from '@/lib/types/table';

/**
 * Hook for managing editable table data
 * - stores edits keyed by row id, so when server returns rows in a different order
 *   (e.g. after sorting) edits are preserved and applied to the correct row.
 */
export const useTableEditing = (initialData: MockDataRow[]) => {
  // Map of id -> partial edits
  const [edits, setEdits] = useState<Record<number, Partial<MockDataRow>>>({});

  const sanitizeEdits = useCallback(
    (current: Record<number, Partial<MockDataRow>>) => {
      if (!initialData.length) return {};
      const ids = new Set(initialData.map((r) => r.id));
      const next: Record<number, Partial<MockDataRow>> = {};
      for (const idStr of Object.keys(current)) {
        const id = Number(idStr);
        if (ids.has(id)) next[id] = current[id];
      }
      return next;
    },
    [initialData]
  );

  const activeEdits = useMemo(() => sanitizeEdits(edits), [edits, sanitizeEdits]);

  const editedData = useMemo(() => {
    return initialData.map((row) => ({ ...row, ...(activeEdits[row.id] ?? {}) }));
  }, [initialData, activeEdits]);

  // Update a cell by rowIndex: resolve id from current editedData
  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: unknown) => {
      setEdits((prev) => {
        const newEdits = { ...prev };
        const row = initialData[rowIndex];
        // If row at this index doesn't exist, ignore
        if (!row) return prev;
        const id = row.id;
        const updatedRow = {
          ...(newEdits[id] ?? {}),
          [columnId]: value,
        } as Partial<MockDataRow>;
        newEdits[id] = updatedRow;
        return newEdits;
      });
    },
    [initialData]
  );

  const resetData = useCallback(() => {
    setEdits({});
  }, []);

  // Allow setting entire editedData programmatically (rebuild edits map)
  const setEditedData = useCallback(
    (data: MockDataRow[]) => {
      const map: Record<number, Partial<MockDataRow>> = {};
      const initialById = new Map<number, MockDataRow>();
      for (const r of initialData) initialById.set(r.id, r);
      for (const r of data) {
        const orig = initialById.get(r.id);
        if (!orig) continue;
        const diff: Partial<MockDataRow> = {};
        const rowRecord = r as Record<string, unknown>;
        const origRecord = orig as Record<string, unknown>;
        (Object.keys(r) as (keyof MockDataRow)[]).forEach((key) => {
          const prop = key as string;
          if (rowRecord[prop] !== origRecord[prop]) {
            (diff as Record<string, unknown>)[prop] = rowRecord[prop];
          }
        });
        if (Object.keys(diff).length > 0) map[r.id] = diff;
      }
      setEdits(map);
    },
    [initialData]
  );

  return {
    editedData,
    updateData,
    resetData,
    setEditedData,
  };
};
