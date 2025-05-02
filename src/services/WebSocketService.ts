import { io, Socket } from 'socket.io-client';
// DefaultEventsMap might be inferred or available via the main Socket type

// Keep existing type for structure, though specific usage might change
interface SocketMessage<T = unknown> {
  type: string; // Event name in Socket.IO
  data?: T; // Payload
}

/**
 * Singleton service for managing Socket.IO connection.
 */
export class SocketIOService {
  private static instance: SocketIOService;
  private socket: Socket<any, any> | null = null;
  private url: string;
  // Keep listeners map, but it will map event names to callbacks
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();
  // Reconnection logic might be handled by socket.io-client itself, simplify for now

  private constructor() {
    // Connect to base URL, Socket.IO handles negotiation
    // Remove the specific path '/ws/alerts'
    this.url = process.env.REACT_APP_WS_URL || "ws://localhost:8000"; 
  }

  public static getInstance(): SocketIOService {
    if (!SocketIOService.instance) {
      SocketIOService.instance = new SocketIOService();
    }
    return SocketIOService.instance;
  }

  public connect(): void {
    if (this.socket?.connected) return;

    // Disconnect previous socket if exists
    if (this.socket) {
        this.socket.disconnect();
    }

    console.log(`Attempting to connect Socket.IO to ${this.url}`);
    this.socket = io(this.url, {
      reconnectionAttempts: 5, // Example: configure reconnection
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Add authentication if needed, e.g.:
      // auth: { token: localStorage.getItem('token') }
    });

    // Remove previous listeners before attaching new ones
    this.socket.offAny();

    this.socket.on('connect', () => {
      console.log(`Socket.IO connected: ${this.socket?.id}`);
      this.emit("connection", { status: "connected", socketId: this.socket?.id });
    });

    // Use onAny again, assuming it exists on the correctly typed Socket
    this.socket.onAny((eventName: string, ...args: any[]) => {
        console.log(`Socket.IO received event '${eventName}':`, args);
        // Assuming the first argument is the data payload
        this.handleMessage(eventName, args.length > 0 ? args[0] : undefined);
    });

    this.socket.on('disconnect', (reason: Socket.DisconnectReason | string) => {
      console.log(`Socket.IO disconnected: ${reason}`);
      this.emit("connection", { status: "disconnected", reason });
      // Reconnection is usually handled automatically by the client
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually if desired
        // this.socket.connect(); // Potentially needed depending on server logic
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error("Socket.IO connection error:", error);
      this.emit("connection", { status: "error", error });
    });
  }

  private handleMessage(eventName: string, data: unknown): void {
    // Use the eventName directly as the type for listeners
    this.emit(eventName, data);
  }

  // Subscribe to a specific Socket.IO event
  public on<T = unknown>(eventName: string, callback: (data: T) => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)?.push(callback as (data: unknown) => void);
    // Attach listener to socket if it exists
    // Note: This simple map doesn't remove socket listeners when off is called - needs improvement for production
    // A better approach uses socket.on directly in components/hooks or manages listeners more robustly here.
    // For simplicity now, we rely on the onAny handler above to call emit, which triggers these stored callbacks.
  }

  // Unsubscribe from a specific Socket.IO event
  public off<T = unknown>(eventName: string, callback: (data: T) => void): void {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback as (data: unknown) => void);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      // Need to also potentially call socket.off(eventName, callback) here if listeners were attached directly
    }
  }

  // Internal emit to stored listeners
  private emit<T = unknown>(eventName: string, data: T): void {
    const callbacks = this.listeners.get(eventName);
    // console.log(`Internal emit for ${eventName}, listeners:`, callbacks?.length);
    if (callbacks) {
      callbacks.forEach((callback) => {
          try {
              callback(data)
          } catch (error) {
              console.error(`Error in listener for event ${eventName}:`, error);
          }
      });
    }
  }

  public disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    console.log("Socket.IO disconnected by client.");
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Emit an event to the Socket.IO server.
   * @param eventName The name of the event to emit.
   * @param data The data payload to send.
   */
  public send(eventName: string, data?: unknown): void {
    if (this.isConnected()) {
      this.socket?.emit(eventName, data);
    } else {
      console.error(`Socket.IO not connected. Cannot send event '${eventName}'.`);
      // TODO: Implement queuing mechanism if needed
    }
  }
}
