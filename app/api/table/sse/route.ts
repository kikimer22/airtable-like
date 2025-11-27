import { NextRequest } from 'next/server';
import { Client } from 'pg';

const DIRECT_DATABASE_URL = process.env.DATABASE_URL!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!DIRECT_DATABASE_URL) {
    return new Response('DIRECT_DATABASE_URL is not set', { status: 500 });
  }

  const client = new Client({
    connectionString: DIRECT_DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query('LISTEN db_updates_channel');

    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      start(controller) {
        // Обробник повідомлень від БД
        client.on('notification', (msg) => {
          console.log('Received notification:', msg.payload);
          const data = `data: ${msg.payload}\n\n`; // Формат SSE
          controller.enqueue(encoder.encode(data));
        });
      },
      cancel() {
        // При відключенні клієнта
        client.query('UNLISTEN db_updates_channel').finally(() => {
          client.end();
          console.log('SSE connection closed and client disconnected');
        });
      },
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('SSE connection error', err);
    await client.end();
    return new Response('Internal server error', { status: 500 });
  }
}
