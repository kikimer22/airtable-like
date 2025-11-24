import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';
import { isTableFieldKey } from '@/lib/table/schema';
import { TABLE_CONFIG } from '@/lib/table/tableData';

type SortingPayload = Array<{ id?: string; desc?: boolean }>;

const buildOrderBy = (
  sorting: SortingPayload,
): Prisma.MockDataTableOrderByWithRelationInput => {
  if (!sorting?.length) {
    return { id: 'asc' };
  }

  const [firstSort] = sorting;
  if (!firstSort?.id || !isTableFieldKey(firstSort.id)) {
    return { id: 'asc' };
  }

  return {
    [firstSort.id]: firstSort.desc ? 'desc' : 'asc',
  } as Prisma.MockDataTableOrderByWithRelationInput;
};

const clampNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  return normalized >= 0 ? normalized : fallback;
};

export async function POST(request: Request) {
  try {
    const { page = 0, pageSize = TABLE_CONFIG.FETCH_SIZE, sorting = [] } = await request.json();
    const safePage = clampNumber(page, 0);
    const safePageSize = clampNumber(pageSize, TABLE_CONFIG.FETCH_SIZE) || TABLE_CONFIG.FETCH_SIZE;

    const [data, totalRowCount] = await Promise.all([
      prisma.mockDataTable.findMany({
        skip: safePage * safePageSize,
        take: safePageSize,
        orderBy: buildOrderBy(sorting as SortingPayload),
      }),
      prisma.mockDataTable.count(),
    ]);

    return NextResponse.json({
      data,
      meta: { totalRowCount },
    });
  } catch (error) {
    console.error('Failed to load mock data rows', error);
    return NextResponse.json(
      { error: 'Не вдалося завантажити дані таблиці' },
      { status: 500 },
    );
  }
}


