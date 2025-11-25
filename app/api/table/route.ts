import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TABLE_CONFIG } from '@/lib/table/tableData';

interface PaginationMeta {
  nextCursor: string | null;
  hasNextPage: boolean;
  pageSize: number;
}

export interface PaginationResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE_SIZE = TABLE_CONFIG.FETCH_SIZE;
const MAX_PAGE_SIZE = 100;

function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  } catch {
    throw new Error('Invalid cursor format');
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const pageSizeParam = searchParams.get('pageSize');
    const pageSize = Math.min(
      Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10)),
      MAX_PAGE_SIZE,
    );

    const validPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

    let decodedCursor: string | undefined;
    if (cursor) { decodedCursor = decodeCursor(cursor); }

    const items = await prisma.mockDataTable.findMany({
      take: validPageSize + 1,
      skip: decodedCursor ? 1 : 0,
      cursor: decodedCursor ? { id: decodedCursor } : undefined,
      orderBy: { id: 'asc' },
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
      }
    });

    const hasNextPage = items.length > validPageSize;
    const data = hasNextPage ? items.slice(0, validPageSize) : items;
    const nextCursor = hasNextPage
      ? encodeCursor(data[data.length - 1]!.id.toString())
      : null;

    return NextResponse.json<PaginationResponse<typeof data>>({
      data,
      meta: {
        nextCursor,
        hasNextPage,
        pageSize: validPageSize,
      },
    });
  } catch (error) {
    console.error('Pagination error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === 'Invalid cursor format') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 },
    );
  }
}
