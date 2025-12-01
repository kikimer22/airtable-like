'use client';

import { useState, useCallback, type FC, useEffect } from 'react';
import { useSSEListener } from '@/lib/hooks/useSSEListener';
import type { SSENotification, FieldChange } from '@/lib/types';

export const NotificationDashboard: FC = () => {
  const [notifications, setNotifications] = useState<SSENotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((notification: SSENotification) => {
    console.log('📬 New notification:', notification);

    setNotifications((prev) => [notification, ...prev].slice(0, 50));
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('❌ Error:', err);
    setError(err.message);
  }, []);

  const { connect, disconnect } = useSSEListener({
    onMessage: handleMessage,
    onError: handleError,
    onConnect: () => setIsConnected(true),
    onDisconnect: () => setIsConnected(false),
  });

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    }
  }, []);

  const renderFieldChange = (field: string, change: FieldChange) => {
    const oldVal = JSON.stringify(change.old);
    const newVal = JSON.stringify(change.new);

    return (
      <div key={field} className="text-xs space-y-1 p-2 bg-gray-50 rounded">
        <p className="font-mono font-semibold text-gray-700">{field}</p>
        <p className="text-red-600">
          <span className="font-medium">−</span> {oldVal}
        </p>
        <p className="text-green-600">
          <span className="font-medium">+</span> {newVal}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Database Changes Monitor</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Listening for database changes...
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={`${notif.logId}-${notif.createdAt}`}
              className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {notif.tableName}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        notif.action === 'INSERT'
                          ? 'bg-green-100 text-green-700'
                          : notif.action === 'UPDATE'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {notif.action}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {notif.payload.id} • Log: {notif.logId.toString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Changes */}
              {notif.action === 'UPDATE' && Object.keys(notif.payload.changes).length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Changed Fields:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(notif.payload.changes).map(([field, change]) =>
                      renderFieldChange(field, change as FieldChange)
                    )}
                  </div>
                </div>
              )}

              {/* Full Data (Collapsed by default) */}
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                  Full Data
                </summary>
                <pre className="mt-2 p-2 bg-gray-900 text-gray-100 rounded overflow-auto max-h-40 text-xs">
                  {JSON.stringify(notif.payload.data, null, 2)}
                </pre>
              </details>
            </div>
          ))
        )}
      </div>

      <button
        onClick={disconnect}
        className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition text-sm font-medium"
      >
        Disconnect
      </button>
    </div>
  );
};
