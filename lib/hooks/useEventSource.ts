import { useEffect, useState } from 'react';
import type { DbUpdateEvent } from '@/lib/types';

export const useEventSource = (url = '/api/old-schemas-data/sse') => {
  const [messages, setMessages] = useState<DbUpdateEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setConnectionStatus('Connected');
      console.log('SSE connection opened');
    };
    eventSource.onmessage = (event) => {
      console.log('Received SSE message:', event.data);
      try {
        const data: DbUpdateEvent = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    };
    eventSource.onerror = (error) => {
      setConnectionStatus('Error/Disconnected');
      console.error('SSE error:', error);
      eventSource.close();
    };
    return () => {
      setConnectionStatus('Disconnected');
      eventSource.close();
      console.log('SSE connection closed');
    };
  }, [url]);

  return {
    messages,
    connectionStatus,
  };
};
