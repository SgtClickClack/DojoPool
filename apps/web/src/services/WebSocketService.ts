import { io, Socket } from 'socket.io-client';

export interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  userId: string;
  username: string;
  userAvatar?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  isPublic: boolean;
}

export interface NewActivityEvent {
  type: 'new_activity_event';
  data: ActivityEvent;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(
    private serverUrl: string = process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      'http://localhost:3002'
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected successfully');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
        });

        // Handle incoming messages
        this.socket.onAny((eventName, data) => {
          this.handleMessage({ type: eventName, data });
        });
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: any): void {
    const eventType = message.type;
    const listeners = this.eventListeners.get(eventType);

    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.add(callback);

    return () => {
      if (listeners.has(callback)) {
        listeners.delete(callback);
      }

      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    };
  }

  emit(event: string, data: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
