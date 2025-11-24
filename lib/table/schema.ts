const padKey = (value: number): string => value.toString().padStart(3, '0');

const createRange = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

export const TABLE_COLUMN_SEGMENTS = [
  { prefix: 'col_s_', start: 1, end: 100, kind: 'string' as const },
  { prefix: 'col_n_', start: 101, end: 172, kind: 'number' as const },
  { prefix: 'col_b_', start: 173, end: 222, kind: 'boolean' as const },
] as const;

const buildKeys = (): string[] => {
  const dynamicKeys = TABLE_COLUMN_SEGMENTS.flatMap(({ prefix, start, end }) =>
    createRange(start, end).map((value) => `${prefix}${padKey(value)}`),
  );

  return ['id', ...dynamicKeys];
};

export const TABLE_FIELD_KEYS = buildKeys() as const;

export type TableFieldKey = (typeof TABLE_FIELD_KEYS)[number];

export type TableFieldKind = (typeof TABLE_COLUMN_SEGMENTS)[number]['kind'] | 'id';

export const isTableFieldKey = (value: string): value is TableFieldKey =>
  (TABLE_FIELD_KEYS as readonly string[]).includes(value);

export const getFieldKind = (field: TableFieldKey): TableFieldKind => {
  if (field === 'id') return 'id';
  const segment = TABLE_COLUMN_SEGMENTS.find(({ prefix }) => field.startsWith(prefix));
  return segment?.kind ?? 'string';
};


