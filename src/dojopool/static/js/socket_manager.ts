/**
 * Optimized client-side WebSocket manager implementation.
 */

import { io, Socket } from "socket.io-client";
import { socketMetrics } from "./socket_metrics";
import {
  ConnectionState,
  ConnectionStatus,
  SocketManager as ISocketManager,
  Message,
  SocketManagerOptions,
} from "./socket_types";

export class SocketManagerImpl implements ISocketManager {
  private static instance: SocketManagerImpl;
  private socket: Socket | null = null;
  private readonly options: SocketManagerOptions;
  private state: ConnectionState = ConnectionState.INITIALIZING;
  private lastError: string | null = null;
  private lastEventTime = Date.now();
  private pendingMessages: Message[] = [];
  private readonly subscriptions = new Map<string, Set<(data: any) => void>>();
  private connectionPromise: Promise<void> | null = null;
  private lastConnectionState: ConnectionStatus | null = null;
  private lastStateTime = 0;
  private readonly STATE_CACHE_TIME = 500; // Cache state for 500ms

  private constructor(options: Partial<SocketManagerOptions> = {}) {
    this.options = {
      url: options.url || "",
      reconnectAttempts: options.reconnectAttempts || 15,
      reconnectDelay: options.reconnectDelay || 1000,
      debug: options.debug || false,
      timeout: options.timeout || 60000,
    };
  }

  public static getInstance(
    options?: Partial<SocketManagerOptions>,
  ): SocketManagerImpl {
    if (!SocketManagerImpl.instance) {
      SocketManagerImpl.instance = new SocketManagerImpl(options);
    }
    return SocketManagerImpl.instance;
  }

  public async connect(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.socket = io(this.options.url, {
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: this.options.reconnectAttempts,
          reconnectionDelay: this.options.reconnectDelay,
          timeout: this.options.timeout,
          // Performance optimizations
          forceNew: false,
          multiplex: true,
          perMessageDeflate: true,
        });

        this.setupEventHandlers(resolve, reject);
      } catch (error) {
        this.log("Error connecting:", error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private setupEventHandlers(
    resolve: () => void,
    reject: (error: any) => void,
  ): void {
    if (!this.socket) return;

    // Use a single message handler for all events
    const messageHandler = (data: string | Message) => {
      try {
        const message = typeof data === "string" ? JSON.parse(data) : data;
        socketMetrics.trackMessageReceived();
        this.handleMessage(message);
      } catch (error) {
        this.log("Error handling message:", error);
      }
    };

    this.socket.on("connect", () => {
      this.updateState(ConnectionState.CONNECTED);
      socketMetrics.trackConnect();
      this.processPendingMessages();
      resolve();
    });

    this.socket.on("disconnect", () => {
      this.updateState(ConnectionState.DISCONNECTED);
    });

    this.socket.on("error", (error) => {
      this.updateState(ConnectionState.ERROR, error.message);
      reject(error);
    });

    this.socket.on("reconnect_attempt", () => {
      socketMetrics.trackReconnect();
    });

    this.socket.on("message", messageHandler);
  }

  private updateState(
    state: ConnectionState,
    error: string | null = null,
  ): void {
    this.state = state;
    this.lastError = error;
    this.lastEventTime = Date.now();
    this.lastConnectionState = null; // Invalidate cache
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.updateState(ConnectionState.DISCONNECTED);
      this.connectionPromise = null;
    }
  }

  public subscribe<T = any>(type: string, callback: (data: T) => void): void {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set());
    }
    this.subscriptions.get(type)?.add(callback);
    this.log("Subscribed to:", type);
  }

  public unsubscribe<T = any>(type: string, callback: (data: T) => void): void {
    const callbacks = this.subscriptions.get(type);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(type);
      }
      this.log("Unsubscribed from:", type);
    }
  }

  public async send<T = any>(type: string, payload: T): Promise<void> {
    const message: Message<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    if (this.socket?.connected) {
      this.socket.emit("message", message);
      socketMetrics.trackMessageSent();
      this.log("Sent message:", message);
    } else {
      this.pendingMessages.push(message);
      this.log("Queued message:", message);
      try {
        await this.connect();
      } catch (error) {
        this.log("Failed to connect:", error);
      }
    }
  }

  private processPendingMessages(): void {
    if (!this.pendingMessages.length) return;

    const messages = [...this.pendingMessages];
    this.pendingMessages = [];

    for (const message of messages) {
      if (this.socket?.connected) {
        this.socket.emit("message", message);
        socketMetrics.trackMessageSent();
        this.log("Sent queued message:", message);
      } else {
        this.pendingMessages.push(message);
      }
    }
  }

  private handleMessage(message: Message): void {
    const callbacks = this.subscriptions.get(message.type);
    if (!callbacks) return;

    for (const callback of callbacks) {
      try {
        callback(message.payload);
      } catch (error) {
        this.log("Error in message handler:", error);
      }
    }
  }

  public getConnectionState(): ConnectionStatus {
    const now = Date.now();

    // Return cached state if within cache time
    if (
      this.lastConnectionState &&
      now - this.lastStateTime < this.STATE_CACHE_TIME
    ) {
      return this.lastConnectionState;
    }

    // Calculate new state
    const state = {
      state: this.state,
      lastError: this.lastError,
      lastEventTime: new Date(this.lastEventTime).toISOString(),
    };

    // Cache the state
    this.lastConnectionState = state;
    this.lastStateTime = now;

    return state;
  }

  public getMetrics() {
    return socketMetrics.getStats();
  }

  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log("[SocketManager]", ...args);
    }
  }
}

// Create singleton instance
export const socketManager = SocketManagerImpl.getInstance({
  debug: true,
  url: process.env.REACT_APP_WS_URL || "http://localhost:8080",
});
