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
    const socket = io(process.env.REACT_APP_WS_URL || "ws://localhost:8000", {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("WebSocket connected");
      this.state.connected = true;
      this.handleReconnection();
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      this.state.connected = false;
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Handle notification events
    socket.on("notification", (data) => {
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

export default new WebSocketService();
