/**
 * WebSocket manager for client-side real-time communication.
 */
class WebSocketManager {
  constructor(options = {}) {
    this.options = {
      url: options.url || `http://localhost:8080`,
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 1000,
      debug: options.debug || false,
    };

    this.socket = null;
    this.reconnectAttempts = 0;
    this.subscriptions = new Map();
    this.pendingMessages = [];
    this.isConnected = false;
    this.connectionPromise = null;
  }

  /**
   * Get authentication token from local storage.
   * @returns {string|null} Authentication token
   */
  getAuthToken() {
    return localStorage.getItem("auth_token");
  }

  /**
   * Connect to the WebSocket server.
   * @returns {Promise} Resolves when connected
   */
  connect() {
    if (this.isConnected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const token = this.getAuthToken();

        this.socket = io(this.options.url, {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: this.options.reconnectAttempts,
          reconnectionDelay: this.options.reconnectDelay,
        });

        this.socket.on("connect", () => {
          this.log("WebSocket connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.processPendingMessages();
          resolve();
        });

        this.socket.on("disconnect", () => {
          this.log("WebSocket closed");
          this.isConnected = false;
        });

        this.socket.on("error", (error) => {
          this.log("WebSocket error:", error);
          reject(error);
        });

        this.socket.on("message", (data) => {
          try {
            const message = typeof data === "string" ? JSON.parse(data) : data;
            this.handleMessage(message);
          } catch (error) {
            this.log("Error parsing message:", error);
          }
        });
      } catch (error) {
        this.log("Error connecting:", error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }
  }

  /**
   * Subscribe to a message type.
   * @param {string} type - Message type
   * @param {function} callback - Callback function
   */
  subscribe(type, callback) {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set());
    }
    this.subscriptions.get(type).add(callback);
  }

  /**
   * Unsubscribe from a message type.
   * @param {string} type - Message type
   * @param {function} callback - Callback function
   */
  unsubscribe(type, callback) {
    const callbacks = this.subscriptions.get(type);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(type);
      }
    }
  }

  /**
   * Send a message to the server.
   * @param {string} type - Message type
   * @param {object} payload - Message payload
   */
  send(type, payload) {
    const message = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    if (this.isConnected) {
      this.socket.emit(type, message);
    } else {
      this.pendingMessages.push(message);
      this.connect().catch((error) => {
        this.log("Failed to connect:", error);
      });
    }
  }

  /**
   * Process any pending messages.
   */
  processPendingMessages() {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      this.socket.emit(message.type, message);
    }
  }

  /**
   * Handle incoming messages.
   * @param {object} message - Message object
   */
  handleMessage(message) {
    const callbacks = this.subscriptions.get(message.type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message.payload);
        } catch (error) {
          this.log("Error in message handler:", error);
        }
      });
    }
  }

  /**
   * Log a message if debug is enabled.
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.options.debug) {
      console.log("[WebSocketManager]", ...args);
    }
  }
}

// Create singleton instance
const websocketManager = new WebSocketManager({
  debug: true,
});

export default websocketManager;
