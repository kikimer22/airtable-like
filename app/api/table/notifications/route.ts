import { debug, warn, error } from '@/lib/logger';

export const runtime = 'nodejs';

import { connectPgOnce, clients } from '@/lib/services/pgListener.service';
import { notificationService } from '@/lib/services/notification.service';

export async function GET(request: Request): Promise<Response> {
  await connectPgOnce();
  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  };

  const responseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        controller.enqueue(encoder.encode(': SSE connected\n\n'));

        const writer = {
          write: async (data: string) => {
            try {
              const trimmed = typeof data === 'string' ? data.trim() : String(data);

              if (trimmed.startsWith('data:')) {
                controller.enqueue(encoder.encode(trimmed + '\n\n'));
                return { done: false };
              }

              if (/^\d+$/.test(trimmed)) {
                const logId = BigInt(trimmed);
                const notification = await notificationService.getLogById(logId);

                if (!notification) {
                  warn('⚠️ Could not retrieve notification data for logId:', logId);
                  return { done: false };
                }

                const safeJson = JSON.stringify(notification, (_key, value) =>
                  typeof value === 'bigint' ? value.toString() : value
                );
                const sseData = `data: ${safeJson}\n\n`;
                controller.enqueue(encoder.encode(sseData));

                debug(`📨 Sent notification: ${notification.tableName} ${notification.action}`);
                return { done: false };
              }

              // Unexpected payload
              warn('⚠️ Writer received unexpected message:', data);
            } catch (err) {
              error('❌ Error processing notification:', err);
            }

            return { done: false };
          },
        };

        clients.add(writer);

        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // Cleanup on abort
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          clients.delete(writer);
          controller.close();
          debug('🔌 SSE client disconnected');
        });
      } catch (err) {
        error('❌ SSE stream error:', err);
        controller.error(err);
      }
    },
  });

  return new Response(responseStream, { headers });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 });
}
