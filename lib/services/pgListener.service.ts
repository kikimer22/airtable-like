import { debug, error, warn } from '@/lib/logger';

export const runtime = 'nodejs';

import { Client, Notification } from 'pg';
import prisma from '@/lib/prisma';

interface SSEWriter {
  write: (data: string) => Promise<{ done: boolean }>;
}

class PgListenerService {
  private static instance: PgListenerService;
  private client: Client | null = null;
  private isConnected = false;
  readonly clients = new Set<SSEWriter>();

  private constructor() {}

  static getInstance(): PgListenerService {
    if (!PgListenerService.instance) {
      PgListenerService.instance = new PgListenerService();
    }
    return PgListenerService.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      const connectionString = process.env.DIRECT_DATABASE_URL;

      if (!connectionString) {
        throw new Error('No DIRECT_DATABASE_URL provided for PgListenerService');
      }

      this.client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
      });

      debug('📡 Connecting to PostgreSQL for LISTEN (pgListener.service)...');
      try {
        const url = new URL(connectionString);
        debug(`📡 Using DB host: ${url.host}`);
      } catch {
        debug('📡 Using connection string: [redacted]');
      }

      await this.client.connect();

      await this.client.query('LISTEN db_updates_channel');

      this.client.on('notification', this.handleNotification.bind(this));

      this.client.on('error', (err) => {
        error('❌ PG Client error in pgListener.service:', err);
        this.reconnect();
      });

      this.isConnected = true;
      debug('✅ PostgreSQL LISTEN initialized (pgListener.service)');
    } catch (err) {
      error('❌ Failed to connect to PostgreSQL (pgListener.service):', err);
      this.isConnected = false;
      throw err;
    }
  }

  private async handleNotification(notification: Notification): Promise<void> {
    try {
      debug('📣 pgListener.service received notification payload:', notification.payload);

      // Parse payload as bigint (Postgres NOTIFY sends the log id as text)
      let logId: bigint;
      try {
        logId = BigInt(notification.payload ?? '0');
      } catch (err) {
        error('⚠️ Invalid payload in pgListener.service (not a bigint):', notification.payload, 'err:', err);
        return;
      }

      if (logId === BigInt(0)) {
        warn('⚠️ Ignoring zero/invalid log id in pgListener.service:', notification.payload);
        return;
      }

      debug('📨 Received notification for log ID (pgListener.service):', logId.toString());

      const entry = await prisma.notificationLog.findUnique({
        where: { id: logId },
        select: { id: true, payload: true, createdAt: true },
      });

      if (!entry) {
        warn('⚠️ Entry not found for ID (pgListener.service):', logId);
        return;
      }

      await this.broadcastToClients(entry.id.toString());
    } catch (err) {
      error('❌ Error handling notification (pgListener.service):', err);
    }
  }

  private async broadcastToClients(message: string): Promise<void> {
    const failedWriters: SSEWriter[] = [];

    for (const writer of this.clients) {
      try {
        await writer.write(message);
      } catch (err) {
        error('⚠️ Failed to write to client, removing...', err);
        failedWriters.push(writer);
      }
    }

    failedWriters.forEach((writer) => this.clients.delete(writer));
  }

  private async reconnect(): Promise<void> {
    debug('🔄 Attempting to reconnect (pgListener.service)...');
    this.isConnected = false;
    this.client = null;

    await new Promise((resolve) => setTimeout(resolve, 5000));
    await this.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.isConnected = false;
      debug('✅ Disconnected from PostgreSQL (pgListener.service)');
    }
  }

  isAlive(): boolean {
    return this.isConnected;
  }
}

const listenerService = PgListenerService.getInstance();

export async function connectPgOnce(): Promise<void> {
  await listenerService.connect();
}

export const clients = listenerService.clients;

export function isPgListenerConnected(): boolean {
  return listenerService.isAlive();
}
