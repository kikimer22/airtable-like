import { debug, warn, error } from '@/lib/logger';

export const runtime = 'nodejs';

import { connectPgOnce, clients } from '@/lib/services/pgListener.service';
import { notificationService } from '@/lib/services/notification.service';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectPgOnce();
  } catch (err) {
    warn('⚠️ pgListener failed to connect for SSE endpoint, continuing without DB listener:', err);
  }
  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  };

  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let writer: { write: (data: string) => Promise<{ done: boolean }>; } | null = null;

  const responseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        controller.enqueue(encoder.encode(': SSE connected\n\n'));

        writer = {
          write: async (data: string) => {
            try {
              const trimmed = data.trim();

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
              return { done: false };
            } catch (err) {
              error('❌ Error processing notification (writer):', err);
              throw err instanceof Error ? err : new Error(String(err));
            }
          },
        };

        clients.add(writer!);
        debug('🔌 SSE client added, total clients:' + String(clients.size));

        heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (err) {
            error('❌ SSE heartbeat error:', err);
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
              heartbeatInterval = null;
            }
          }
        }, 30000);

        request.signal.addEventListener('abort', () => {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          if (writer) {
            clients.delete(writer);
            writer = null;
          }
          try {
            controller.close();
          } catch {}
          debug('🔌 SSE client disconnected (abort), total clients:' + String(clients.size));
        });

      } catch (err) {
        error('❌ SSE stream error:', err);
        controller.error(err);
      }
    },
    cancel(reason) {
      try {
        debug('🔌 ReadableStream cancelled, reason:', reason);
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (writer) {
          clients.delete(writer);
          writer = null;
        }
      } catch (err) {
        error('❌ Error during ReadableStream cancel:', err);
      }
    },
  });

  return new Response(responseStream, { headers });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 });
}
