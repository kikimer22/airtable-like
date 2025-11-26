import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TABLE_CONFIG } from '@/lib/constants';
import { decodeCursor, encodeCursor } from '@/lib/utils';
import { PaginationResponse } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor'); // base64 or null
    const direction = (searchParams.get('direction') ?? 'forward') as 'forward' | 'backward';

    const pageSize = TABLE_CONFIG.FETCH_SIZE;

    const take = pageSize + 1;

    const order = direction === 'forward' ? 'asc' : 'desc';

    const queryOptions: any = {
      take,
      orderBy: { id: order },
      select: {
        id: true,
        col_s_001: true,
        col_s_002: true,
        col_s_003: true,
        col_n_101: true,
        col_n_102: true,
        col_n_103: true,
        col_b_173: true,
        col_b_174: true,
        col_b_175: true,
      },
    };

    if (cursor) {
      queryOptions.cursor = { id: decodeCursor(cursor) };
      if (direction === 'forward') {
        queryOptions.skip = 1;
      }
    }

    const items = await prisma.mockDataTable.findMany(queryOptions);

    const itemsOrdered = direction === 'backward' ? items.reverse() : items;

    const hasExtra = items.length > pageSize;
    const data = hasExtra ? itemsOrdered.slice(0, pageSize) : itemsOrdered;

    const nextCursor = data.length > 0 ? encodeCursor(data[data.length - 1]!.id) : null;
    const prevCursor = data.length > 0 ? encodeCursor(data[0]!.id) : null;

    const hasNextPage = direction === 'forward' ? hasExtra : !!cursor;
    const hasPrevPage = direction === 'forward' ? !!cursor : hasExtra;

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
  } catch (error) {
    console.error('Pagination error:', error);
    if (error instanceof Error && error.message === 'Invalid cursor format') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
