import { Alert } from '../types/alert';

export type WebSocketMessageType = 
  | 'alert'
  | 'alert.acknowledge'
  | 'alert.dismiss'
  | 'alert.flag'
  | 'connection'
  | 'heartbeat'
  | 'batch'
  | 'subscribe';

interface WebSocketMessage<T = unknown> {
  type: string;
  data?: T;
}

interface BatchedMessage {
  type: 'batch';
  payload: WebSocketMessage[];
}

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private url: string;
  private messageQueue: WebSocketMessage[] = [];
  private batchedMessages: WebSocketMessage[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // Batch messages every 100ms
  private readonly MAX_BATCH_SIZE = 50; // Maximum number of messages per batch

  private constructor() {
    this.url = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/alerts`;
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage | BatchedMessage = JSON.parse(event.data);
        if (this.isBatchedMessage(message)) {
          this.handleBatchedMessage(message);
        } else {
          this.handleMessage(message as WebSocketMessage);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('connection', { status: 'disconnected' });
      this.handleReconnection();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('connection', { status: 'error', error });
    };
  }

  private isBatchedMessage(message: WebSocketMessage): message is BatchedMessage {
    return message.type === 'batch' && Array.isArray((message as BatchedMessage).payload);
  }

  private handleBatchedMessage(batchedMessage: BatchedMessage): void {
    batchedMessage.payload.forEach(message => {
      this.handleMessage(message);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
  }

  private handleMessage(message: WebSocketMessage): void {
    this.emit(message.type, message.data);
  }

  public on<T = unknown>(type: string, callback: (data: T) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(callback as (data: unknown) => void);
  }

  public off<T = unknown>(type: string, callback: (data: T) => void): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback as (data: unknown) => void);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit<T = unknown>(type: string, data: T): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public send(message: WebSocketMessage): void {
    this.queueMessage(message);
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);

    if (this.messageQueue.length >= this.MAX_BATCH_SIZE) {
      this.flushMessageQueue();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushMessageQueue(), this.BATCH_DELAY);
    }
  }

  private flushMessageQueue(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.messageQueue.length === 0) return;

    if (this.ws?.readyState === WebSocket.OPEN) {
      const batchedMessage: BatchedMessage = {
        type: 'batch',
        payload: [...this.messageQueue]
      };
      this.ws.send(JSON.stringify(batchedMessage));
      this.messageQueue = [];
    } else {
      console.error('WebSocket is not connected');
    }
  }
} 