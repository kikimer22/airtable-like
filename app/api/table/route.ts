import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TABLE_CONFIG } from '@/lib/constants';
import { decodeCursor, encodeCursor } from '@/lib/utils';
import { PaginationResponse } from '@/lib/types';
import { error } from '@/lib/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor'); // base64 or null
    const direction = (searchParams.get('direction') ?? 'forward') as 'forward' | 'backward';

    const pageSize = TABLE_CONFIG.FETCH_SIZE;

    const take = pageSize + 1;

    const order = direction === 'forward' ? 'asc' : 'desc';

    const queryOptions = {
      take,
      orderBy: { id: order },
      select: {
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
      },
    } as const;

    if (cursor) {
      (queryOptions as Record<string, unknown>).cursor = { id: decodeCursor(cursor) };
      (queryOptions as Record<string, unknown>).skip = 1;
    }

    const items = await prisma.dataTable.findMany(queryOptions);

    const itemsOrdered = direction === 'backward' ? items.reverse() : items;

    const hasExtra = items.length > pageSize;
    const data = hasExtra ? itemsOrdered.slice(0, pageSize) : itemsOrdered;

    let nextCursor: string | null = null;
    let prevCursor: string | null = null;
    let hasNextPage = false;
    let hasPrevPage = false;

    if (data.length > 0) {
      if (direction === 'forward') {
        nextCursor = hasExtra ? encodeCursor(data[data.length - 1]!.id) : null;
        prevCursor = cursor ? encodeCursor(data[0]!.id) : null;
        hasNextPage = hasExtra;
        hasPrevPage = !!cursor;
      } else {
        // direction === 'backward'
        prevCursor = hasExtra ? encodeCursor(data[0]!.id) : null;
        nextCursor = cursor ? encodeCursor(data[data.length - 1]!.id) : null;
        hasPrevPage = hasExtra;
        hasNextPage = !!cursor;
      }
    }

    return NextResponse.json<PaginationResponse<typeof data[0]>>({
      data,
      meta: {
        nextCursor,
        prevCursor,
        hasNextPage,
        hasPrevPage,
        pageSize,
      },
    });
  } catch (err) {
    error('Pagination error:', err);
    if (err instanceof Error && err.message === 'Invalid cursor format') {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
