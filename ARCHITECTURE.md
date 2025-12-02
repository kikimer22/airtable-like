## Architectural Overview

Цей проєкт — це **Next.js (App Router)** застосунок з інтерактивною таблицею, яка підтримує:
- **інфініті скрол** (двонапрямкову пагінацію cursor-based),
- **віртуалізацію рядків та колонок**,
- **інлайн-редагування клітинок** з **оптимістичним оновленням кешу** без додаткового рефетчу.

### Фронтенд

- **Вхідна сторінка**: `app/page.tsx` рендерить основну таблицю `Table` та `NotificationDashboard`.
- **Таблиця**: `components/table/Table.tsx`
  - Використовує **@tanstack/react-table** для колонок, сортування та рендеру клітинок.
  - Використовує **@tanstack/react-virtual** для віртуалізації рядків (`useVirtualRow`) та колонок (`useVirtualColumn`), щоб ефективно працювати з великими наборами даних.
  - Обгортає усе в контейнер з фіксованою висотою та `overflow: auto` для інфініті-скролу.
- **UI-компоненти таблиці**: `components/ui/table.tsx` та допоміжні компоненти в `components/table/*` інкапсулюють розмітку `<table>`, `<thead>`, `<tbody>` і стилі.

### Стан та запити даних

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

### Редагування клітинок та оптимістичні оновлення

- **Редагування**:
  - Колонки таблиці визначені в хелперах (`columns` з `lib/helpers/columnsCreator`), де задається `cell`-рендерер (у т.ч. редаговані клітинки).
  - Внесені зміни тимчасово зберігаються в локальному стані (через хук `useOptimisticUpdates` з `lib/hooks`), що дозволяє показувати змінені значення ще до збереження в БД.
- **Оптимістичний апдейт кешу**:
  - `useOptimisticUpdates` інтегрується з React Query (через `TABLE_QUERY_KEY`) і:
    - **миттєво оновлює кеш** таблиці при зміні клітини;
    - відмічає наявність незбережених змін (`hasChanges`), показуючи панель з кнопками **Save/Cancel** у `Table.tsx`;
    - на `Save` відправляє батч оновлень на бекенд, не виконуючи додаткового `refetch`, а покладаючись на вже оновлений кеш.
  - У разі помилки бекенду `useOptimisticUpdates` може відкотити локальні зміни (revert кеш).

### API-шар

- **Отримання даних таблиці**: `app/api/table/route.ts`
  - Обробляє `GET` з параметрами `cursor`, `limit`, `direction`.
  - Використовує `prisma.dataTable.findMany` з `orderBy id`, cursor-based пагінацією та `TABLE_SELECT_FIELDS`.
  - Повертає `PaginationResponse` з `data` та `meta.nextCursor` / `meta.prevCursor`.
- **Оновлення клітинок**: `app/api/table/update-cells/route.ts`
  - Обробляє `PATCH` з масивом оновлень `{ rowId, columnId, newValue }`.
  - Валідує дані, групує оновлення по `rowId` і виконує `prisma.dataTable.updateMany`.
  - Логує результат та, за потреби, надсилає нотифікації через SSE-клієнти (`clients` з `pgListener.service`) для синхронізації інших клієнтів.

### База даних та Prisma

- **Prisma**:
  - Конфігурація в `prisma/schema.prisma`, ініціалізація клієнта в `lib/prisma.ts`.
  - Модель даних для таблиці — `dataTable` (генерований тип `DataTableRow` у `lib/generated/prisma/...`).
- **Міграції та сидинг**:
  - Міграції знаходяться в `prisma/migrations/*`.
  - Початкове наповнення даних — в `prisma/seed.ts`, створює велику таблицю для тестування віртуалізації та інфініті скролу.

### Потік даних (end-to-end)

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


