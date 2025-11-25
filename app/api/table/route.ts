import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TABLE_CONFIG } from '@/lib/table/tableData';

export type Cursor = string | null;

interface PaginationMeta {
  nextCursor: Cursor;
  prevCursor?: Cursor;
  hasNextPage: boolean;
  hasPrevPage?: boolean;
  pageSize: number;
}

export interface PaginationResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE_SIZE = TABLE_CONFIG.FETCH_SIZE;
const MAX_PAGE_SIZE = TABLE_CONFIG.FETCH_SIZE;

function encodeCursor(id: number): string {
  return Buffer.from(id.toString()).toString('base64');
}

function decodeCursor(cursor: string): number {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const id = parseInt(decoded, 10);
    if (Number.isNaN(id)) {
      throw new Error('Invalid cursor ID');
    }
    return id;
  } catch {
    throw new Error('Invalid cursor format');
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor'); // base64 or null
    const direction = (searchParams.get('direction') ?? 'forward') as 'forward' | 'backward';
    const pageSizeParam = searchParams.get('pageSize');

    const pageSize = Math.min(
      Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10)),
      MAX_PAGE_SIZE,
    );

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

    let items = await prisma.mockDataTable.findMany(queryOptions);

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
