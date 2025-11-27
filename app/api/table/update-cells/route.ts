import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface CellUpdate {
  rowId: number;
  columnId: string;
  newValue: unknown;
}

interface UpdateRequest {
  updates: CellUpdate[];
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[UPDATE-CELLS] Request received');

    const body: UpdateRequest = await request.json();
    const { updates } = body;

    console.log('[UPDATE-CELLS] Received updates:', JSON.stringify(updates, null, 2));

    if (!Array.isArray(updates) || updates.length === 0) {
      console.warn('[UPDATE-CELLS] No updates provided');
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Групуємо оновлення за rowId для мінімізації запитів до БД
    const updatesByRowId = new Map<number, Record<string, unknown>>();

    for (const update of updates) {
      const { rowId, columnId, newValue } = update;

      if (!rowId || !columnId) {
        console.error('[UPDATE-CELLS] Invalid update:', { rowId, columnId });
        return NextResponse.json({
          error: 'Invalid update',
          details: 'Missing rowId or columnId'
        }, { status: 400 });
      }

      // Валідація columnId - повинен починатися з col_
      if (!columnId.startsWith('col_')) {
        console.warn(`[UPDATE-CELLS] Skipping invalid column: ${columnId}`);
        continue;
      }

      // Накопичуємо всі оновлення для кожного рядку
      if (!updatesByRowId.has(rowId)) {
        updatesByRowId.set(rowId, {});
      }

      updatesByRowId.get(rowId)![columnId] = newValue;
    }

    console.log('[UPDATE-CELLS] Updates by row:', JSON.stringify(Array.from(updatesByRowId.entries()), null, 2));

    // Виконуємо оновлення в БД
    const results = [];
    for (const [rowId, updateData] of updatesByRowId) {
      try {
        if (Object.keys(updateData).length === 0) {
          console.warn(`[UPDATE-CELLS] No valid columns to update for row ${rowId}`);
          continue;
        }

        console.log(`[UPDATE-CELLS] Updating row ${rowId} with:`, JSON.stringify(updateData, null, 2));

        const result = await prisma.dataTable.updateMany({
          where: { id: rowId },
          data: updateData,
        });

        if (result.count > 0) {
          results.push({ rowId, success: true, columnsUpdated: Object.keys(updateData).length });
          console.log(`[UPDATE-CELLS] Successfully updated row ${rowId}`);
        } else {
          console.warn(`[UPDATE-CELLS] Row ${rowId} not found`);
          results.push({ rowId, success: false, reason: 'Row not found' });
        }
      } catch (rowError) {
        console.error(`[UPDATE-CELLS] Error updating row ${rowId}:`, rowError);
        results.push({ rowId, success: false, reason: String(rowError) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[UPDATE-CELLS] Completed: ${successCount}/${results.length} updates successful`);

    return NextResponse.json({
      success: true,
      updatedCount: successCount,
      results,
    });
  } catch (error) {
    console.error('[UPDATE-CELLS] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update cells', details: errorMessage },
      { status: 500 }
    );
  }
}


