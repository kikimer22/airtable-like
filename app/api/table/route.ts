import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TABLE_SELECT_FIELDS } from '@/lib/constants';
import { DataTableRow, PaginationResponse } from '@/lib/types';
import { error } from '@/lib/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const cursor = searchParams.get('cursor');
  const take = parseInt(searchParams.get('limit') ?? '10', 10);
  const direction = searchParams.get('direction') ?? 'forward';

  try {
    let rows = [];

    if (direction === 'forward') {
      rows = await prisma.dataTable.findMany({
        take,
        orderBy: { id: 'asc' },
        ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
        select: TABLE_SELECT_FIELDS,
      }) as DataTableRow[];
    } else {   // backward
      rows = await prisma.dataTable.findMany({
        take,
        orderBy: { id: 'desc' },
        ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
        select: TABLE_SELECT_FIELDS,
      }) as DataTableRow[];
      rows = rows.reverse();
    }

    const nextCursor =
      rows.length > 0 ? String(rows[rows.length - 1].id) : null;
    const prevCursor =
      rows.length > 0 ? String(rows[0].id) : null;

    return NextResponse.json<PaginationResponse<typeof rows[0]>>({
      data: rows,
      meta: {
        nextCursor,
        prevCursor,
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
