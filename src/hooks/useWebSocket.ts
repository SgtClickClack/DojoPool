import { useEffect, useCallback, useState } from 'react';
import { WebSocketService, WebSocketMessage } from '../services/WebSocketService';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = WebSocketService.getInstance();

  const connect = useCallback(() => {
    ws.connect();
  }, [ws]);

  const disconnect = useCallback(() => {
    ws.disconnect();
  }, [ws]);

  const send = useCallback((message: WebSocketMessage) => {
    ws.send(message);
  }, [ws]);

  const subscribe = useCallback((type: string, callback: (data: any) => void) => {
    ws.on(type, callback);
    return () => ws.off(type, callback);
  }, [ws]);

  useEffect(() => {
    const handleConnection = (data: { status: string }) => {
      setIsConnected(data.status === 'connected');
    };

    ws.on('connection', handleConnection);
    connect();

    return () => {
      ws.off('connection', handleConnection);
      disconnect();
    };
  }, [connect, disconnect, ws]);

  return {
    isConnected,
    connect,
    disconnect,
    send,
    subscribe
  };
}; 