import { toast } from 'react-toastify';
import { analyticsService } from './analytics';

/**
 * Types for WebSocket events
 */
export type WebSocketEventType = 
  | 'leaderboard_update' 
  | 'tournament_update'
  | 'match_update'
  | 'notification';

export interface WebSocketMessage<T = any> {
  type: WebSocketEventType;
  data: T;
  timestamp: string;
}

export interface WebSocketConfig {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export type MessageHandler<T = any> = (data: T) => void;

/**
 * Service for managing WebSocket connections
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<WebSocketEventType, Set<MessageHandler>> = new Map();
  private isConnecting = false;

  constructor() {
    this.url = process.env.REACT_APP_WS_URL || 'wss://api.dojopool.com/ws';
    this.config = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 5000,
    };
  }

  /**
   * Initialize WebSocket connection
   */
  public connect(config?: Partial<WebSocketConfig>): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    // Apply custom config if provided
    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      analyticsService.trackEvent('websocket_connect_initiated');
      
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      analyticsService.trackEvent('websocket_connect_error', { error: String(error) });
    }
  }

  /**
   * Close WebSocket connection
   */
  public disconnect(): void {
    if (!this.socket) {
      return;
    }

    // Clear any reconnect timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Set config to not auto reconnect
    this.config.autoReconnect = false;
    
    try {
      this.socket.close();
    } catch (error) {
      console.error('Error closing WebSocket connection:', error);
    }
    
    analyticsService.trackEvent('websocket_disconnect');
  }

  /**
   * Subscribe to a specific WebSocket event type
   */
  public subscribe<T>(eventType: WebSocketEventType, handler: MessageHandler<T>): () => void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, new Set());
    }
    
    this.messageHandlers.get(eventType)?.add(handler as MessageHandler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler as MessageHandler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(eventType);
        }
      }
    };
  }

  /**
   * Send a message through the WebSocket
   */
  public send(message: Omit<WebSocketMessage, 'timestamp'>): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message, WebSocket is not connected');
      return false;
    }

    try {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString()
      };
      
      this.socket.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      analyticsService.trackEvent('websocket_send_error', { 
        messageType: message.type,
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Check if the WebSocket is currently connected
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    console.log('WebSocket connection established');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Execute onOpen callback if provided
    if (this.config.onOpen) {
      this.config.onOpen();
    }
    
    analyticsService.trackEvent('websocket_connect_success');
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnecting = false;
    
    // Execute onClose callback if provided
    if (this.config.onClose) {
      this.config.onClose();
    }
    
    analyticsService.trackEvent('websocket_close', { 
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    // Attempt to reconnect if autoReconnect is enabled
    if (this.config.autoReconnect) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnecting = false;
    
    // Execute onError callback if provided
    if (this.config.onError) {
      this.config.onError(event);
    }
    
    analyticsService.trackEvent('websocket_error');
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Get handlers for this event type
      const handlers = this.messageHandlers.get(message.type);
      
      if (handlers) {
        // Call all registered handlers for this event type
        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (handlerError) {
            console.error(`Error in ${message.type} handler:`, handlerError);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.isConnecting || 
        (this.socket && this.socket.readyState === WebSocket.OPEN) || 
        this.reconnectTimeout) {
      return;
    }

    if (this.config.maxReconnectAttempts && this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.warn(`Maximum reconnect attempts (${this.config.maxReconnectAttempts}) reached`);
      toast.error('Unable to connect to game server. Please refresh the page.');
      analyticsService.trackEvent('websocket_max_reconnect_attempts');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts || 'unlimited'})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.config.reconnectInterval);
    
    analyticsService.trackEvent('websocket_reconnect_attempt', { 
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService; 