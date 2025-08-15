import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface WebSocketOptions {
  url: string;
  onMessage?: (data: string) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

interface WebSocketHook {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (message: WebSocketMessage) => void;
  subscribe: (type: string, callback: (data: any) => void) => () => void;
}

export const useWebSocket = (options: WebSocketOptions): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(
    new Map(),
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(options.url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      options.onOpen?.();
    };

    ws.onmessage = (event) => {
      options.onMessage?.(event.data);
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        const callbacks = subscribersRef.current.get(message.type);
        callbacks?.forEach((callback) => callback(message.payload));
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      options.onError?.(error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      options.onClose?.();
    };
  }, [options]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback(
    (type: string, callback: (data: any) => void) => {
      if (!subscribersRef.current.has(type)) {
        subscribersRef.current.set(type, new Set());
      }
      subscribersRef.current.get(type)?.add(callback);

      return () => {
        subscribersRef.current.get(type)?.delete(callback);
      };
    },
    [],
  );

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    send,
    subscribe,
  };
};
