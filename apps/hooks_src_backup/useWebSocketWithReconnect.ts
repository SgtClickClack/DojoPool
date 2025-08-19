import { useEffect, useCallback, useState, useRef } from 'react';
import {
  WebSocketService,
  type WebSocketMessageType,
} from '../services/WebSocketService';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface WebSocketOptions {
  initialDelay: number;
  maxDelay: number;
  maxAttempts: number;
}

interface BaseWebSocketMessage {
  type: string;
  data?: any;
}

interface SubscriptionMessage extends BaseWebSocketMessage {
  type: 'subscribe';
  channel: string;
  callback?: (data: any) => void;
}

interface UnsubscribeMessage extends BaseWebSocketMessage {
  type: 'unsubscribe';
  channel: string;
}

type WebSocketMessage =
  | BaseWebSocketMessage
  | SubscriptionMessage
  | UnsubscribeMessage;

type UnsubscribeFunction = () => void;

const DEFAULT_CONFIG: WebSocketOptions = {
  initialDelay: 1000, // Start with 1 second delay
  maxDelay: 30000, // Maximum delay of 30 seconds
  maxAttempts: 10, // Maximum number of reconnection attempts
};

export function useWebSocketWithReconnect(options: WebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const subscriptions = useRef<Map<string, Set<(data: any) => void>>>(
    new Map()
  );

  const wsService = WebSocketService.getInstance();
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectConfig = { ...DEFAULT_CONFIG, ...options };

  const calculateDelay = useCallback(() => {
    const delay = Math.min(
      reconnectConfig.initialDelay * Math.pow(2, reconnectAttempt),
      reconnectConfig.maxDelay
    );
    // Add some random jitter to prevent all clients from reconnecting simultaneously
    return delay + Math.random() * 1000;
  }, [
    reconnectAttempt,
    reconnectConfig.initialDelay,
    reconnectConfig.maxDelay,
  ]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    clearReconnectTimeout();
    wsService.connect();
  }, [wsService, clearReconnectTimeout]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    wsService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [wsService, clearReconnectTimeout]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempt >= reconnectConfig.maxAttempts) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('reconnecting');
    const delay = calculateDelay();

    reconnectTimeoutRef.current = window.setTimeout(() => {
      setReconnectAttempt((prev) => prev + 1);
      connect();
    }, delay);
  }, [reconnectAttempt, reconnectConfig.maxAttempts, calculateDelay, connect]);

  const send = useCallback(
    (message: WebSocketMessage): UnsubscribeFunction | void => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket is not connected');
        return;
      }

      ws.current.send(JSON.stringify(message));

      if (message.type === 'subscribe' && 'channel' in message) {
        const channel = message.channel;
        const handlers = subscriptions.current.get(channel) || new Set();
        const handler = (data: any) => {
          if (data.channel === channel && message.callback) {
            message.callback(data);
          }
        };
        handlers.add(handler);
        subscriptions.current.set(channel, handlers);

        return () => {
          const handlers = subscriptions.current.get(channel);
          if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
              subscriptions.current.delete(channel);
              ws.current?.send(
                JSON.stringify({ type: 'unsubscribe', channel })
              );
            }
          }
        };
      }
    },
    []
  );

  const subscribe = useCallback(
    (type: WebSocketMessageType, callback: (data: any) => void) => {
      wsService.on(type, callback);
      return () => wsService.off(type, callback);
    },
    [wsService]
  );

  useEffect(() => {
    const handleConnection = (data: { status: string }) => {
      const isNowConnected = data.status === 'connected';
      setIsConnected(isNowConnected);
      setConnectionStatus(isNowConnected ? 'connected' : 'disconnected');

      if (isNowConnected) {
        setReconnectAttempt(0);
        clearReconnectTimeout();
      } else if (
        !isNowConnected &&
        reconnectAttempt < reconnectConfig.maxAttempts
      ) {
        attemptReconnect();
      }
    };

    wsService.on('connection', handleConnection);
    connect();

    return () => {
      wsService.off('connection', handleConnection);
      disconnect();
    };
  }, [
    wsService,
    connect,
    disconnect,
    attemptReconnect,
    reconnectAttempt,
    reconnectConfig.maxAttempts,
    clearReconnectTimeout,
  ]);

  return {
    isConnected,
    connectionStatus,
    reconnectAttempt,
    connect,
    disconnect,
    send,
    subscribe,
  };
}
