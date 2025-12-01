import prisma from '@/lib/prisma';
import type { FieldChange, NotificationPayload, SSENotification } from '@/lib/types';
import { error, warn, debug } from '@/lib/logger';

class NotificationService {
  async getLogById(logId: bigint): Promise<SSENotification | null> {
    try {
      const log = await prisma.notificationLog.findUnique({
        where: { id: logId },
        select: {
          id: true,
          tableName: true,
          action: true,
          payload: true,
          createdAt: true,
        },
      });

      if (!log) {
        warn('⚠️ Log not found:', logId);
        return null;
      }

      return {
        logId: String(log.id) as unknown as bigint,
        tableName: log.tableName,
        action: log.action as 'INSERT' | 'UPDATE' | 'DELETE',
        payload: this.validatePayload(log.payload),
        createdAt: log.createdAt,
      };
    } catch (err) {
      error('❌ Error fetching notification log:', err);
      return null;
    }
  }

  private validatePayload(payload: unknown): NotificationPayload {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid payload format');
    }

    const p = payload as Record<string, unknown>;

    return {
      id: typeof p.id === 'number' ? p.id : 0,
      table: typeof p.table === 'string' ? p.table : '',
      action: (p.action as 'INSERT' | 'UPDATE' | 'DELETE') || 'UPDATE',
      timestamp: typeof p.timestamp === 'string' ? p.timestamp : new Date().toISOString(),
      data: typeof p.data === 'object' && p.data !== null
        ? (p.data as Record<string, unknown>)
        : {},
      changes: typeof p.changes === 'object' && p.changes !== null
        ? (p.changes as Record<string, FieldChange>)
        : {},
    };
  }

  async getRecentLogs(limit: number = 100) {
    return prisma.notificationLog.findMany({
      select: {
        id: true,
        tableName: true,
        action: true,
        payload: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async cleanupOldLogs(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.notificationLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    debug(`🧹 Deleted ${result.count} old notification logs`);
    return result.count;
  }

  async getLogsByFilter(
    tableName?: string,
    action?: 'INSERT' | 'UPDATE' | 'DELETE',
    limit: number = 50
  ) {
    return prisma.notificationLog.findMany({
      where: {
        ...(tableName && { tableName }),
        ...(action && { action }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const notificationService = new NotificationService();
