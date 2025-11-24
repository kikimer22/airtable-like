import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isTableFieldKey } from '@/lib/table/schema';

type IncomingChange = {
  id: number;
  data?: Record<string, unknown>;
};

const sanitizeChange = (change: IncomingChange) => {
  if (!change?.id || typeof change.id !== 'number') return null;
  const data = change.data ?? {};
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue;
    if (isTableFieldKey(key)) {
      sanitized[key] = value;
    }
  }
  if (!Object.keys(sanitized).length) return null;
  return { id: change.id, data: sanitized };
};

export async function POST(request: Request) {
  try {
    const { changes } = await request.json();
    if (!Array.isArray(changes)) {
      return NextResponse.json({ error: 'Невірний формат змін' }, { status: 400 });
    }

    const updates = changes
      .map((change: IncomingChange) => sanitizeChange(change))
      .filter((change): change is { id: number; data: Record<string, unknown> } => Boolean(change));

    if (!updates.length) {
      return NextResponse.json({ error: 'Немає валідних змін для збереження' }, { status: 400 });
    }

    await prisma.$transaction(
      updates.map(({ id, data }) =>
        prisma.mockDataTable.update({
          where: { id },
          data,
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to persist mock data updates', error);
    return NextResponse.json({ error: 'Не вдалося зберегти зміни' }, { status: 500 });
  }
}


