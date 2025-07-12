/**
 * WebSocket client module.
 * Provides a wrapper around Socket.IO for real-time communication.
 */
import { io, Socket } from "socket.io-client";
import { Config } from "../config";

interface SocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

type EventCallback = (data: any) => void;
type ErrorCallback = (error: Error) => void;

export class SocketClient {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<EventCallback>>;
  private errorHandlers: Set<ErrorCallback>;
  private options: SocketOptions;

  constructor(options: SocketOptions = {}) {
    this.eventHandlers = new Map();
    this.errorHandlers = new Set();
    this.options = {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      ...options,
    };
  }

  /**
   * Initialize socket connection.
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem(Config.STORAGE.AUTH_TOKEN);
    if (!token) {
      this.handleError(new Error("Authentication required"));
      return;
    }

    this.socket = io('http://localhost:8080', {
      ...this.options,
      auth: {
        token,
      },
    });

    this.setupEventHandlers();
  }

  /**
   * Close socket connection.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Set up default event handlers.
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on(Config.SOCKET.CONNECT, () => {
      this.emit("connect");
    });

    this.socket.on(Config.SOCKET.DISCONNECT, () => {
      this.emit("disconnect");
    });

    this.socket.on(Config.SOCKET.ERROR, (error: Error) => {
      this.handleError(error);
    });

    // Custom events
    this.socket.on(Config.SOCKET.GAME_UPDATE, (data) => {
      this.emit("game_update", data);
    });

    this.socket.on(Config.SOCKET.CHAT_MESSAGE, (data) => {
      this.emit("chat_message", data);
    });

    this.socket.on(Config.SOCKET.NOTIFICATION, (data) => {
      this.emit("notification", data);
    });
  }

  /**
   * Subscribe to an event.
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(callback);
  }

  /**
   * Unsubscribe from an event.
   */
  off(event: string, callback: EventCallback): void {
    this.eventHandlers.get(event)?.delete(callback);
  }

  /**
   * Subscribe to error events.
   */
  onError(callback: ErrorCallback): void {
    this.errorHandlers.add(callback);
  }

  /**
   * Unsubscribe from error events.
   */
  offError(callback: ErrorCallback): void {
    this.errorHandlers.delete(callback);
  }

  /**
   * Emit an event to all subscribers.
   */
  private emit(event: string, data?: any): void {
    this.eventHandlers.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        this.handleError(error as Error);
      }
    });
  }

  /**
   * Handle and propagate errors.
   */
  private handleError(error: Error): void {
    this.errorHandlers.forEach((callback) => {
      try {
        callback(error);
      } catch (e) {
        console.error("Error in error handler:", e);
      }
    });
  }

  /**
   * Send data to server.
   */
  send(event: string, data?: any): void {
    if (!this.socket?.connected) {
      this.handleError(new Error("Socket not connected"));
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Join a room.
   */
  joinRoom(room: string): void {
    this.send("join_room", { room });
  }

  /**
   * Leave a room.
   */
  leaveRoom(room: string): void {
    this.send("leave_room", { room });
  }

  /**
   * Check if socket is connected.
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create and export default instance
export const socket = new SocketClient();
