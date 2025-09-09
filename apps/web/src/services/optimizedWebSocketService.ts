import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import React from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketConfig {
  url: string;
  namespace?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
  maxPayload?: number;
}

export interface WebSocketStats {
  connected: boolean;
  reconnectionAttempts: number;
  lastMessageTime: number;
  messageCount: number;
  errorCount: number;
  latency: number;
}

export class OptimizedWebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private stats: WebSocketStats;
  private messageQueue: Array<{ event: string; data: any; timestamp: number }> =
    [];
  private maxQueueSize = 100;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      maxPayload: 1000000,
      ...config,
    };

    this.stats = {
      connected: false,
      reconnectionAttempts: 0,
      lastMessageTime: 0,
      messageCount: 0,
      errorCount: 0,
      latency: 0,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  connect(): void {
    if (this.socket?.connected) return;

    try {
      const url = this.config.namespace
        ? `${this.config.url}/${this.config.namespace}`
        : this.config.url;

      this.socket = io(url, {
        autoConnect: false,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        timeout: this.config.timeout,
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        forceNew: false,
        multiplex: true,
      });

      this.setupEventHandlers();
      this.socket.connect();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.stats.errorCount++;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.stats.connected = true;
      this.stats.reconnectionAttempts = 0;
      console.log('WebSocket connected');
      this.startHeartbeat();
      this.processMessageQueue();
    });

    this.socket.on('disconnect', (reason) => {
      this.stats.connected = false;
      console.log('WebSocket disconnected:', reason);
      this.stopHeartbeat();

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.stats.errorCount++;
      this.stats.reconnectionAttempts++;
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('error', (error) => {
      this.stats.errorCount++;
      console.error('WebSocket error:', error);
    });

    this.socket.on('message', (data) => {
      this.handleMessage(data);
    });

    // Handle custom events
    this.socket.onAny((eventName, ...args) => {
      this.handleCustomEvent(eventName, args[0]);
    });
  }

  private handleMessage(data: any): void {
    this.stats.messageCount++;
    this.stats.lastMessageTime = Date.now();

    // Measure latency if timestamp is provided
    if (data.timestamp) {
      this.stats.latency = Date.now() - data.timestamp;
    }

    // Notify listeners
    this.notifyListeners('message', data);
  }

  private handleCustomEvent(eventName: string, data: any): void {
    this.stats.messageCount++;
    this.stats.lastMessageTime = Date.now();

    // Notify listeners for specific events
    this.notifyListeners(eventName, data);
  }

  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      // Queue message if not connected
      this.queueMessage(event, data);
      return;
    }

    try {
      this.socket.emit(event, {
        ...data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to emit message:', error);
      this.stats.errorCount++;
    }
  }

  private queueMessage(event: string, data: any): void {
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }

    this.messageQueue.push({
      event,
      data,
      timestamp: Date.now(),
    });
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.emit(message.event, message.data);
      }
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.stats.connected = false;
    this.messageQueue = [];
  }

  getStats(): WebSocketStats {
    return { ...this.stats };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// React hook for optimized WebSocket usage
export const useOptimizedWebSocket = (config: WebSocketConfig) => {
  const { metrics } = usePerformanceOptimization('WebSocketService');
  const [service] = React.useState(() => new OptimizedWebSocketService(config));
  const [stats, setStats] = React.useState<WebSocketStats>(service.getStats());

  React.useEffect(() => {
    const updateStats = () => {
      setStats(service.getStats());
    };

    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [service]);

  React.useEffect(() => {
    return () => {
      service.disconnect();
    };
  }, [service]);

  return {
    service,
    stats,
    metrics,
    emit: service.emit.bind(service),
    on: service.on.bind(service),
    off: service.off.bind(service),
    connect: service.connect.bind(service),
    disconnect: service.disconnect.bind(service),
    isConnected: service.isConnected.bind(service),
  };
};
