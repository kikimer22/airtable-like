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
          // The clients set expects a writer with signature write(data: string)
          write: async (data: string) => {
            try {
              const trimmed = typeof data === 'string' ? data.trim() : String(data);

              // If it's already a preformatted SSE payload, enqueue directly
              if (trimmed.startsWith('data:')) {
                controller.enqueue(encoder.encode(trimmed + '\n\n'));
                return { done: false };
              }

              // If it's numeric text (log id), try to fetch the notification
              if (/^\d+$/.test(trimmed)) {
                const logId = BigInt(trimmed);
                const notification = await notificationService.getLogById(logId);

                if (!notification) {
                  console.warn('⚠️ Could not retrieve notification data for logId:', logId);
                  return { done: false };
                }

                // Safe stringify: convert BigInt to string
                const safeJson = JSON.stringify(notification, (_key, value) =>
                  typeof value === 'bigint' ? value.toString() : value
                );
                const sseData = `data: ${safeJson}\n\n`;
                controller.enqueue(encoder.encode(sseData));

                console.log(`📨 Sent notification: ${notification.tableName} ${notification.action}`);
                return { done: false };
              }

              // Unexpected payload
              console.warn('⚠️ Writer received unexpected message:', data);
            } catch (error) {
              console.error('❌ Error processing notification:', error);
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
          console.log('🔌 SSE client disconnected');
        });
      } catch (error) {
        console.error('❌ SSE stream error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(responseStream, { headers });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 });
}
