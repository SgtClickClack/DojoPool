import { io, Socket } from "socket.io-client";

interface WebSocketState {
  connected: boolean;
  socket: Socket | null;
  subscriptions: Map<string, Set<(data: any) => void>>;
}

class WebSocketService {
  private state: WebSocketState = {
    connected: false,
    socket: null,
    subscriptions: new Map(),
  };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const socket = io("ws://localhost:3101", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("WebSocketService.ts:62 Socket.IO connected:", socket.id);
      this.state.connected = true;
      this.handleReconnection();
    });

    socket.on("disconnect", (reason: string) => {
      console.log("WebSocketService.ts:74 Socket.IO disconnected:", reason);
      this.state.connected = false;
    });

    socket.on("connect_error", (error: Error) => {
      console.error("WebSocketService.ts:84 Socket.IO connection error:", error);
      this.state.connected = false;
    });

    socket.on("error", (error: Error) => {
      console.error("WebSocketService.ts:89 Socket.IO error:", error);
    });

    // Handle notification events
    socket.on("notification", (data: any) => {
      this.notifySubscribers("notifications", data);
    });

    this.state.socket = socket;
  }

  private handleReconnection(): void {
    if (this.state.socket) {
      // Resubscribe to all channels
      this.state.subscriptions.forEach((_, channel) => {
        this.state.socket?.emit("subscribe", { channel });
      });
    }
  }

  public subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.state.subscriptions.has(channel)) {
      this.state.subscriptions.set(channel, new Set());
      this.state.socket?.emit("subscribe", { channel });
    }

    const subscribers = this.state.subscriptions.get(channel);
    subscribers?.add(callback);

    return () => {
      const subscribers = this.state.subscriptions.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.state.subscriptions.delete(channel);
          this.state.socket?.emit("unsubscribe", { channel });
        }
      }
    };
  }

  private notifySubscribers(channel: string, data: any): void {
    const subscribers = this.state.subscriptions.get(channel);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      });
    }
  }

  public isConnected(): boolean {
    return this.state.connected;
  }

  public disconnect(): void {
    this.state.socket?.disconnect();
  }

  public reconnect(): void {
    this.state.socket?.connect();
  }
}

export const SocketIOService = new WebSocketService();