## Architectural Overview

Цей проєкт — це **Next.js (App Router)** застосунок з інтерактивною таблицею, яка підтримує:
- **інфініті скрол** (двонапрямкову пагінацію cursor-based),
- **віртуалізацію рядків та колонок**,
- **інлайн-редагування клітинок** з **оптимістичним оновленням кешу** без додаткового рефетчу.

This project is a **Next.js (App Router)** application with an interactive data table that supports:
- **infinite scroll** (bi-directional cursor-based pagination),
- **row and column virtualization**,
- **inline cell editing** with **optimistic cache updates** without additional refetching.

---

### Фронтенд / Frontend

- **Вхідна сторінка**: `app/page.tsx` рендерить основну таблицю `Table` та `NotificationDashboard`.
- **Таблиця**: `components/table/Table.tsx`
  - Використовує **@tanstack/react-table** для колонок, сортування та рендеру клітинок.
  - Використовує **@tanstack/react-virtual** для віртуалізації рядків (`useVirtualRow`) та колонок (`useVirtualColumn`), щоб ефективно працювати з великими наборами даних.
  - Обгортає усе в контейнер з фіксованою висотою та `overflow: auto` для інфініті-скролу.
- **UI-компоненти таблиці**: `components/ui/table.tsx` та допоміжні компоненти в `components/table/*` інкапсулюють розмітку `<table>`, `<thead>`, `<tbody>` і стилі.

- **Entry page**: `app/page.tsx` renders the main `Table` and `NotificationDashboard`.
- **Table**: `components/table/Table.tsx`
  - Uses **@tanstack/react-table** for column definitions, sorting, and cell rendering.
  - Uses **@tanstack/react-virtual** for row (`useVirtualRow`) and column (`useVirtualColumn`) virtualization to efficiently handle large datasets.
  - Wraps everything in a fixed-height container with `overflow: auto` to enable infinite scrolling.
- **Table UI components**: `components/ui/table.tsx` and helpers in `components/table/*` encapsulate `<table>`, `<thead>`, `<tbody>` markup and styling.

---

### Стан та запити даних / State and Data Fetching

- **React Query**:
  - Хук `useTableData` (`lib/hooks/useTableData.ts`) використовує `useInfiniteQuery` з ключем `TABLE_QUERY_KEY = ['table']`.
  - Дані завантажуються порціями по `TABLE_CONFIG.FETCH_SIZE` записів з обмеженням `FETCH_MAX_PAGES`.
  - Підтримується **cursor-based пагінація** з напрямком `forward/backward` для двонапрямкового інфініті скролу.
  - Хук повертає зручні похідні дані: `flattenedData`, `loadedPagesCount`, `firstPageCursor`, `lastPageCursor`.
- **Віртуалізація**:
  - `useVirtualRow` та `useVirtualColumn` (реекспорт з `lib/hooks/index.ts`) будують віртуальні списки рядків/колонок на основі контейнера таблиці.
  - Відображається тільки видима частина таблиці, а позиціювання реалізоване через `transform: translateY(...)` та padding-колонки.
- **Інфініті-скрол**:
  - `useBidirectionalInfinite` слідкує за положенням скролу (через `headerRef`/`footerRef`) і викликає `fetchNextPage` / `fetchPreviousPage`, коли користувач наближається до країв завантажених даних.

- **React Query**:
  - The `useTableData` hook (`lib/hooks/useTableData.ts`) uses `useInfiniteQuery` with key `TABLE_QUERY_KEY = ['table']`.
  - Data is loaded in chunks of `TABLE_CONFIG.FETCH_SIZE` records with a `FETCH_MAX_PAGES` limit.
  - Supports **cursor-based pagination** with `forward/backward` direction for bi-directional infinite scrolling.
  - Returns convenient derived values: `flattenedData`, `loadedPagesCount`, `firstPageCursor`, `lastPageCursor`.
- **Virtualization**:
  - `useVirtualRow` and `useVirtualColumn` (re-exported from `lib/hooks/index.ts`) build virtual lists of rows/columns based on the table container.
  - Only the visible portion of the table is rendered; positioning is done via `transform: translateY(...)` and padding columns.
- **Infinite scroll**:
  - `useBidirectionalInfinite` observes scroll position (via `headerRef`/`footerRef`) and calls `fetchNextPage` / `fetchPreviousPage` when the user approaches the loaded data boundaries.

---

### Редагування клітинок та оптимістичні оновлення / Cell Editing and Optimistic Updates

- **Редагування**:
  - Колонки таблиці визначені в хелперах (`columns` з `lib/helpers/columnsCreator`), де задається `cell`-рендерер (у т.ч. редаговані клітинки).
  - Внесені зміни тимчасово зберігаються в локальному стані (через хук `useOptimisticUpdates` з `lib/hooks`), що дозволяє показувати змінені значення ще до збереження в БД.
- **Оптимістичний апдейт кешу**:
  - `useOptimisticUpdates` інтегрується з React Query (через `TABLE_QUERY_KEY`) і:
    - **миттєво оновлює кеш** таблиці при зміні клітини;
    - відмічає наявність незбережених змін (`hasChanges`), показуючи панель з кнопками **Save/Cancel** у `Table.tsx`;
    - на `Save` відправляє батч оновлень на бекенд, не виконуючи додаткового `refetch`, а покладаючись на вже оновлений кеш.
  - У разі помилки бекенду `useOptimisticUpdates` може відкотити локальні зміни (revert кеш).

- **Editing**:
  - Table columns are defined in helpers (`columns` from `lib/helpers/columnsCreator`), where each column specifies a `cell` renderer (including editable cells).
  - Changes are temporarily stored in local state (via the `useOptimisticUpdates` hook from `lib/hooks`), allowing updated values to be displayed before they are persisted to the database.
- **Optimistic cache updates**:
  - `useOptimisticUpdates` integrates with React Query (using `TABLE_QUERY_KEY`) and:
    - **instantly updates the table cache** when a cell changes;
    - tracks whether there are unsaved changes (`hasChanges`), showing a **Save/Cancel** toolbar in `Table.tsx`;
    - on **Save**, sends a batched update request to the backend without performing an extra `refetch`, relying on the already updated cache.
  - On backend error, `useOptimisticUpdates` can revert local changes (revert cache).

---

### API-шар / API Layer

- **Отримання даних таблиці**: `app/api/table/route.ts`
  - Обробляє `GET` з параметрами `cursor`, `limit`, `direction`.
  - Використовує `prisma.dataTable.findMany` з `orderBy id`, cursor-based пагінацією та `TABLE_SELECT_FIELDS`.
  - Повертає `PaginationResponse` з `data` та `meta.nextCursor` / `meta.prevCursor`.
- **Оновлення клітинок**: `app/api/table/update-cells/route.ts`
  - Обробляє `PATCH` з масивом оновлень `{ rowId, columnId, newValue }`.
  - Валідує дані, групує оновлення по `rowId` і виконує `prisma.dataTable.updateMany`.
  - Логує результат та, за потреби, надсилає нотифікації через SSE-клієнти (`clients` з `pgListener.service`) для синхронізації інших клієнтів.

- **Fetch table data**: `app/api/table/route.ts`
  - Handles `GET` with `cursor`, `limit`, `direction` query params.
  - Uses `prisma.dataTable.findMany` with `orderBy id`, cursor-based pagination and `TABLE_SELECT_FIELDS`.
  - Returns `PaginationResponse` with `data` and `meta.nextCursor` / `meta.prevCursor`.
- **Update cells**: `app/api/table/update-cells/route.ts`
  - Handles `PATCH` with an array of updates `{ rowId, columnId, newValue }`.
  - Validates input, groups updates by `rowId`, and executes `prisma.dataTable.updateMany`.
  - Logs the result and, if needed, sends notifications through SSE clients (`clients` from `pgListener.service`) to keep other clients in sync.

---

### База даних та Prisma / Database and Prisma

- **Prisma**:
  - Конфігурація в `prisma/schema.prisma`, ініціалізація клієнта в `lib/prisma.ts`.
  - Модель даних для таблиці — `dataTable` (генерований тип `DataTableRow` у `lib/generated/prisma/...`).
- **Міграції та сидинг**:
  - Міграції знаходяться в `prisma/migrations/*`.
  - Початкове наповнення даних — в `prisma/seed.ts`, створює велику таблицю для тестування віртуалізації та інфініті скролу.

- **Prisma**:
  - Configuration in `prisma/schema.prisma`, client initialization in `lib/prisma.ts`.
  - Main table model is `dataTable` (generated type `DataTableRow` in `lib/generated/prisma/...`).
- **Migrations and seeding**:
  - Migrations live in `prisma/migrations/*`.
  - Initial data seeding is handled by `prisma/seed.ts`, which creates a large table for testing virtualization and infinite scrolling.

---

### Потік даних (end-to-end) / Data Flow (end-to-end)

1. Користувач відкриває головну сторінку → рендериться `Table`.
2. `useTableData` виконує `GET /api/table` і зберігає сторінки в React Query.
3. Віртуалізатори рядків/колонок показують лише видиму частину `flattenedData`.
4. При скролі `useBidirectionalInfinite` підвантажує нові сторінки, поки є `nextCursor`/`prevCursor`.
5. Користувач змінює значення в клітинці:
   - `useOptimisticUpdates` оновлює кеш React Query і локальний стан змін.
6. При натисканні **Save**:
   - відправляється `PATCH /api/table/update-cells` з батчем змін;
   - у разі успіху кеш вже відповідає актуальним даним (без рефетчу);
   - у разі помилки кеш може бути скасовано до попереднього стану.

1. The user opens the main page → `Table` is rendered.
2. `useTableData` performs `GET /api/table` and stores pages in React Query.
3. Row/column virtualizers render only the visible portion of `flattenedData`.
4. On scroll, `useBidirectionalInfinite` loads new pages while `nextCursor` / `prevCursor` are available.
5. The user edits a cell value:
   - `useOptimisticUpdates` updates the React Query cache and local change state.
6. On **Save**:
   - a `PATCH /api/table/update-cells` request is sent with a batch of changes;
   - on success, the cache already matches the latest data (no refetch needed);
   - on error, the cache can be rolled back to the previous state.


