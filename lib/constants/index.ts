export const TABLE_SELECT_FIELDS = {
  id: true,
  col_s_01: true,
  col_s_02: true,
  col_s_03: true,
  col_n_01: true,
  col_n_02: true,
  col_n_03: true,
  col_b_01: true,
  col_b_02: true,
  col_b_03: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const TABLE_ALLOWED_FIELDS = new Set([
  'id',
  'col_s_01', 'col_s_02', 'col_s_03',
  'col_n_01', 'col_n_02', 'col_n_03',
  'col_b_01', 'col_b_02', 'col_b_03',
  'createdAt', 'updatedAt',
]) as ReadonlySet<string>;

export const TABLE_CONFIG = {
  FETCH_SIZE: 50,
  FETCH_THRESHOLD: 0.1,
  FETCH_ROOT_MARGIN: 104,
  FETCH_MAX_PAGES: 3,
  ROW_HEIGHT: 52,
  ROWS_OVERSCAN: 2,
  COLUMNS_OVERSCAN: 2,
  COLUMNS_LENGTH: 222,
  TABLE_HEIGHT: 785,
  COLUMN_WIDTHS_STRING: 160,
  COLUMN_WIDTHS_NUMBER: 120,
  COLUMN_WIDTHS_BOOLEAN: 100,
  COLUMN_WIDTHS_ID: 80,
} as const;
