import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { clients } from '@/lib/services/pgListener.service';
import { debug, error, warn } from '@/lib/logger';

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
    debug('[UPDATE-CELLS] Request received');

    const body: UpdateRequest = await request.json();
    const { updates } = body;

    debug('[UPDATE-CELLS] Received updates:', JSON.stringify(updates, null, 2));

    if (!Array.isArray(updates) || updates.length === 0) {
      warn('[UPDATE-CELLS] No updates provided');
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const updatesByRowId = new Map<number, Record<string, unknown>>();

    for (const update of updates) {
      const { rowId, columnId, newValue } = update;

      if (!rowId || !columnId) {
        error('[UPDATE-CELLS] Invalid update:', { rowId, columnId });
        return NextResponse.json({
          error: 'Invalid update',
          details: 'Missing rowId or columnId'
        }, { status: 400 });
      }

      if (!columnId.startsWith('col_')) {
        warn(`[UPDATE-CELLS] Skipping invalid column: ${columnId}`);
        continue;
      }

      if (!updatesByRowId.has(rowId)) {
        updatesByRowId.set(rowId, {});
      }

      updatesByRowId.get(rowId)![columnId] = newValue;
    }

    debug('[UPDATE-CELLS] Updates by row:', JSON.stringify(Array.from(updatesByRowId.entries()), null, 2));

    const results = [];
    for (const [rowId, updateData] of updatesByRowId) {
      try {
        if (Object.keys(updateData).length === 0) {
          warn(`[UPDATE-CELLS] No valid columns to update for row ${rowId}`);
          continue;
        }

        debug(`[UPDATE-CELLS] Updating row ${rowId} with:`, JSON.stringify(updateData, null, 2));

        const result = await prisma.dataTable.updateMany({
          where: { id: rowId },
          data: updateData,
        });

        if (result.count > 0) {
          results.push({ rowId, success: true });
          debug(`[UPDATE-CELLS] Successfully updated row ${rowId}`);

          try {
            const logs = await prisma.$queryRaw<Array<{ id: bigint }>>`
                SELECT id
                FROM notification_logs_table
                WHERE table_name = ${'data_table'}
                  AND (payload ->>'id')::int = ${rowId}
                ORDER BY "createdAt" DESC
                    LIMIT 1
            `;

            const logId = Array.isArray(logs) && logs[0] && logs[0].id ? String(logs[0].id) : null;
            if (logId) {
              debug('[UPDATE-CELLS] Fallback: found notification log id', logId);
              let written = 0;
              // Broadcast log id to all connected SSE writers
              for (const writer of clients) {
                try {
                  // writer expects a string payload; the notifications route will
                  // fetch full payload by log id and format SSE for clients.
                  await writer.write(logId);
                  written++;
                } catch (err) {
                  // swallow individual writer errors; pgListener will clean up dead writers
                  error('[UPDATE-CELLS] Fallback: failed to write to a client:', err);
                }
              }
              debug(`[UPDATE-CELLS] Fallback: broadcast attempted to ${written} writers`);
            }
          } catch (fallbackErr) {
            warn('[UPDATE-CELLS] Fallback broadcast failed:', fallbackErr);
          }

        } else {
          warn(`[UPDATE-CELLS] Row ${rowId} not found`);
          results.push({ rowId, success: false, reason: 'Row not found' });
        }
      } catch (rowError) {
        error(`[UPDATE-CELLS] Error updating row ${rowId}:`, rowError);
        results.push({ rowId, success: false, reason: String(rowError) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    debug(`[UPDATE-CELLS] Completed: ${successCount}/${results.length} updates successful`);

    return NextResponse.json({
      success: true,
      updatedCount: successCount,
      results,
    });
  } catch (err) {
    error('[UPDATE-CELLS] Fatal error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update cells', details: errorMessage },
      { status: 500 }
    );
  }
}
