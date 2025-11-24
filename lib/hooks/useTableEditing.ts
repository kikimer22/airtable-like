import { useState, useCallback, useMemo } from 'react';
import type { MockDataRow, MockDataEditsMap, MockDataUpdatePayload } from '@/lib/types/table';
import { isTableFieldKey } from '@/lib/table/schema';

export const useTableEditing = (initialData: MockDataRow[]) => {
  const [edits, setEdits] = useState<MockDataEditsMap>({});

  const sanitizeEdits = useCallback(
    (current: MockDataEditsMap) => {
      if (!initialData.length) return {};
      const ids = new Set(initialData.map((r) => r.id));
      const next: MockDataEditsMap = {};
      for (const idStr of Object.keys(current)) {
        const id = Number(idStr);
        if (!ids.has(id)) continue;
        const rowEdits = current[id];
        if (!rowEdits) continue;
        const filtered: Partial<MockDataRow> = {};
        for (const [key, value] of Object.entries(rowEdits)) {
          if (isTableFieldKey(key)) {
            filtered[key] = value;
          }
        }
        if (Object.keys(filtered).length) {
          next[id] = filtered;
        }
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
        if (!row || !isTableFieldKey(columnId)) return prev;
        const id = row.id;
        const originalValue = (row as Record<string, unknown>)[columnId];
        const existingEdits = newEdits[id] ? { ...newEdits[id] } : {};
        if (Object.is(originalValue, value)) {
          delete existingEdits[columnId as keyof MockDataRow];
        } else {
          existingEdits[columnId as keyof MockDataRow] = value as MockDataRow[keyof MockDataRow];
        }
        if (Object.keys(existingEdits).length === 0) {
          delete newEdits[id];
        } else {
          newEdits[id] = existingEdits;
        }
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
      const map: MockDataEditsMap = {};
      const initialById = new Map<number, MockDataRow>();
      for (const r of initialData) initialById.set(r.id, r);
      for (const r of data) {
        const orig = initialById.get(r.id);
        if (!orig) continue;
        const diff: Partial<MockDataRow> = {};
        (Object.keys(r) as (keyof MockDataRow)[]).forEach((key) => {
          const prop = key as string;
          if (!isTableFieldKey(prop)) return;
          const nextValue = (r as Record<string, unknown>)[prop];
          const origValue = (orig as Record<string, unknown>)[prop];
          if (nextValue !== origValue) {
            diff[prop] = nextValue as MockDataRow[keyof MockDataRow];
          }
        });
        if (Object.keys(diff).length > 0) map[r.id] = diff;
      }
      setEdits(map);
    },
    [initialData]
  );

  const hasPendingEdits = useMemo(() => Object.keys(activeEdits).length > 0, [activeEdits]);

  const serializeEdits = useCallback((): MockDataUpdatePayload => {
    return Object.entries(activeEdits).map(([id, data]) => ({
      id: Number(id),
      data,
    }));
  }, [activeEdits]);

  return {
    editedData,
    updateData,
    resetData,
    setEditedData,
    hasPendingEdits,
    serializeEdits,
  };
};
