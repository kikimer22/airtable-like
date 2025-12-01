export const TABLE_FIELDS = [
  'id',
  'col_s_01', 'col_s_02', 'col_s_03',
  'col_n_01', 'col_n_02', 'col_n_03',
  'col_b_01', 'col_b_02', 'col_b_03',
  'createdAt', 'updatedAt',
] as const;

export const TABLE_SELECT_FIELDS = Object.fromEntries(
  TABLE_FIELDS.map((field) => [field, true])
) as Record<typeof TABLE_FIELDS[number], true>;

export const TABLE_ALLOWED_FIELDS = new Set(TABLE_FIELDS) as ReadonlySet<string>;

export const TABLE_CONFIG = {
  FETCH_SIZE: 50,
  FETCH_THRESHOLD: 0.1,
  FETCH_ROOT_MARGIN: 52,
  FETCH_MAX_PAGES: 3,
  ROW_HEIGHT: 52,
  ROWS_OVERSCAN: 3,
  COLUMNS_OVERSCAN: 3,
  COLUMNS_LENGTH: 222,
  TABLE_HEIGHT: 785,
  COLUMN_WIDTHS_STRING: 160,
  COLUMN_WIDTHS_NUMBER: 120,
  COLUMN_WIDTHS_BOOLEAN: 100,
  COLUMN_WIDTHS_ID: 80,
} as const;
