import { EventEmitter } from 'events';
import WebSocket from 'ws';
import {
  NetworkMessageType,
  NetworkMessage,
  NetworkError,
  NetworkStats,
  NodeAddress,
  NetworkTransportConfig,
  NetworkEventMap,
  NetworkEventHandler
} from './types';

interface TypedEventEmitter<Events extends Record<string | symbol, NetworkEventHandler<any[]>>> {
  on<E extends keyof Events>(event: E, listener: Events[E]): TypedEventEmitter<Events>;
  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>): boolean;
}

export class NetworkTransport extends (EventEmitter as { new(): TypedEventEmitter<NetworkEventMap> }) {
  private readonly nodeId: string;
  private readonly port: number;
  private readonly peers: Map<string, NodeAddress>;
  private readonly heartbeatInterval: number;
  private readonly connectionTimeout: number;
  private isRunning: boolean;
  private stats: NetworkStats;
  private heartbeatTimer?: NodeJS.Timeout;
  private server: WebSocket.Server | null = null;
  private connections: Map<string, WebSocket> = new Map();
  private connectionRetries: Map<string, number> = new Map();

  constructor(config: NetworkTransportConfig) {
    super();
    this.nodeId = config.nodeId;
    this.port = config.port;
    this.peers = new Map(config.peers.map(peer => [peer.nodeId, peer]));
    this.heartbeatInterval = config.heartbeatInterval ?? 5000;
    this.connectionTimeout = config.connectionTimeout ?? 30000;
    this.isRunning = false;
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      activeConnections: 0,
      errors: 0,
      lastError: null,
      pendingMessages: 0,
      queueSize: 0,
      lastMessageTimestamp: Date.now()
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    try {
      await this.startServer();
      await this.connectToPeers();
      this.startHeartbeat();
      this.isRunning = true;
      this.emit('connect', this.nodeId);
    } catch (error) {
      const networkError: NetworkError = {
        code: 'START_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start network transport',
        timestamp: Date.now(),
        details: JSON.stringify(error)
      };
      this.handleError(networkError);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      this.stopHeartbeat();
      await this.disconnectFromPeers();
      await this.stopServer();
      this.isRunning = false;
      this.emit('disconnect', this.nodeId);
    } catch (error) {
      const networkError: NetworkError = {
        code: 'STOP_FAILED',
        message: error instanceof Error ? error.message : 'Failed to stop network transport',
        timestamp: Date.now(),
        details: JSON.stringify(error)
      };
      this.handleError(networkError);
      throw error;
    }
  }

  async send<T>(targetNodeId: string, type: NetworkMessageType, payload: T): Promise<void> {
    if (!this.isRunning) {
      const error: NetworkError = {
        code: 'NOT_RUNNING',
        message: 'NetworkTransport is not running',
        timestamp: Date.now(),
        details: ''
      };
      this.handleError(error);
      throw error;
    }

    const message: NetworkMessage<T> = {
      id: `${this.nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      source: this.nodeId,
      target: targetNodeId,
      payload,
      timestamp: Date.now()
    };

    try {
      const connection = this.connections.get(targetNodeId);
      if (!connection) {
        const error: NetworkError = {
          code: 'NO_CONNECTION',
          message: `No connection to node ${targetNodeId}`,
          timestamp: Date.now(),
          details: ''
        };
        this.handleError(error);
        throw error;
      }

      const messageString = JSON.stringify(message);
      connection.send(messageString);
      this.stats.messagesSent++;
      this.stats.bytesTransferred += messageString.length;
      this.emit('message', message);
    } catch (error) {
      const networkError: NetworkError = {
        code: 'SEND_FAILED',
        message: error instanceof Error ? error.message : 'Failed to send message',
        timestamp: Date.now(),
        details: JSON.stringify(error)
      };
      this.handleError(networkError);
      throw networkError;
    }
  }

  async broadcast<T>(type: NetworkMessageType, payload: T): Promise<void> {
    const promises = Array.from(this.peers.keys()).map(nodeId => 
      this.send(nodeId, type, payload)
    );
    await Promise.all(promises);
  }

  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = new WebSocket.Server({
          host: '127.0.0.1',
          port: this.port
        });

        this.server.on('connection', this.handleConnection.bind(this));
        this.server.on('error', (error) => {
          const networkError: NetworkError = {
            code: 'SERVER_ERROR',
            message: error instanceof Error ? error.message : 'WebSocket server error',
            timestamp: Date.now(),
            details: JSON.stringify(error)
          };
          this.handleError(networkError);
          reject(error);
        });

        this.server.on('listening', () => {
          console.log(`Node ${this.nodeId} listening on port ${this.port}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async stopServer(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => this.server!.close(() => resolve()));
      this.server = null;
    }
  }

  private async connectToPeers(): Promise<void> {
    const promises = Array.from(this.peers.values()).map(peer => this.connectToPeer(peer));
    await Promise.all(promises);
  }

  private async connectToPeer(peer: NodeAddress): Promise<void> {
    if (peer.nodeId === this.nodeId) {
      return; // Don't connect to self
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`Node ${this.nodeId} connecting to ${peer.nodeId} at ws://127.0.0.1:${peer.port}`);
        const ws = new WebSocket(`ws://127.0.0.1:${peer.port}`);

        ws.on('open', () => {
          console.log(`Node ${this.nodeId} connected to ${peer.nodeId}`);
          this.connections.set(peer.nodeId, ws);
          this.stats.activeConnections++;
          this.connectionRetries.delete(peer.nodeId);

          // Send identification message
          const identMessage: NetworkMessage<{nodeId: string}> = {
            id: `${this.nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: NetworkMessageType.CONNECT,
            source: this.nodeId,
            target: peer.nodeId,
            payload: { nodeId: this.nodeId },
            timestamp: Date.now()
          };
          ws.send(JSON.stringify(identMessage));
          resolve();
        });

        ws.on('error', (error) => {
          console.error(`Node ${this.nodeId} failed to connect to ${peer.nodeId}:`, error);
          const networkError: NetworkError = {
            code: 'PEER_CONNECTION_ERROR',
            message: `Failed to connect to peer ${peer.nodeId}`,
            timestamp: Date.now(),
            details: JSON.stringify(error)
          };
          this.handleError(networkError);
          reject(error);
        });

        ws.on('close', () => {
          console.log(`Node ${this.nodeId} disconnected from ${peer.nodeId}`);
          this.connections.delete(peer.nodeId);
          this.stats.activeConnections--;
          this.emit('disconnect', peer.nodeId);
        });

        ws.on('message', (data) => {
          try {
            const dataString = data.toString();
            const message = JSON.parse(dataString) as NetworkMessage<unknown>;
            this.stats.messagesReceived++;
            this.stats.bytesTransferred += Buffer.byteLength(dataString);
            this.stats.lastMessageTimestamp = Date.now();
            this.emit('message', message);
          } catch (error) {
            const networkError: NetworkError = {
              code: 'MESSAGE_PARSE_ERROR',
              message: error instanceof Error ? error.message : 'Failed to parse message',
              timestamp: Date.now(),
              details: JSON.stringify(error)
            };
            this.handleError(networkError);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleConnection(ws: WebSocket): void {
    let peerId: string | null = null;

    ws.on('message', (data) => {
      try {
        const dataString = data.toString();
        const message = JSON.parse(dataString) as NetworkMessage<unknown>;
        
        // Store the peer ID on first message
        if (!peerId) {
          peerId = message.source;
          this.connections.set(peerId, ws);
          this.stats.activeConnections++;
        }

        this.stats.messagesReceived++;
        this.stats.bytesTransferred += Buffer.byteLength(dataString);
        this.stats.lastMessageTimestamp = Date.now();
        this.emit('message', message);
      } catch (error) {
        const networkError: NetworkError = {
          code: 'MESSAGE_PARSE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to parse message',
          timestamp: Date.now(),
          details: JSON.stringify(error)
        };
        this.handleError(networkError);
      }
    });

    ws.on('close', () => {
      if (peerId) {
        this.connections.delete(peerId);
        this.stats.activeConnections--;
        this.emit('disconnect', peerId);
      }
    });

    ws.on('error', (error) => {
      const networkError: NetworkError = {
        code: 'CONNECTION_ERROR',
        message: error instanceof Error ? error.message : 'WebSocket error',
        timestamp: Date.now(),
        details: JSON.stringify(error)
      };
      this.handleError(networkError);
    });

    // Send initial identification message
    const identMessage: NetworkMessage<{nodeId: string}> = {
      id: `${this.nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: NetworkMessageType.CONNECT,
      source: this.nodeId,
      target: '*',
      payload: { nodeId: this.nodeId },
      timestamp: Date.now()
    };
    ws.send(JSON.stringify(identMessage));
  }

  private async disconnectFromPeers(): Promise<void> {
    for (const [, connection] of this.connections) {
      connection.close();
    }
    this.connections.clear();
    this.stats.activeConnections = 0;
  }

  private handleDisconnect(peer: NodeAddress): void {
    const connection = this.connections.get(peer.nodeId);
    if (connection) {
      connection.close();
      this.connections.delete(peer.nodeId);
      this.stats.activeConnections--;

      // Attempt to reconnect if within retry limits
      const retries = this.connectionRetries.get(peer.nodeId) || 0;
      if (retries < this.connectionTimeout) {
        this.connectionRetries.set(peer.nodeId, retries + 1);
        setTimeout(() => {
          this.connectToPeer(peer);
        }, Math.min(1000 * Math.pow(2, retries), 30000));
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.broadcast(NetworkMessageType.HEARTBEAT, {
        timestamp: Date.now(),
        nodeId: this.nodeId
      }).catch(error => {
        const networkError: NetworkError = {
          code: 'HEARTBEAT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send heartbeat',
          timestamp: Date.now(),
          details: JSON.stringify(error)
        };
        this.handleError(networkError);
      });
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private handleError(error: NetworkError): void {
    this.stats.errors++;
    this.stats.lastError = error;
    this.emit('error', error);
  }

  getStats(): NetworkStats {
    return { ...this.stats };
  }

  /**
   * Gets the current number of connected peers.
   * @returns The number of active peer connections.
   */
  public getPeerCount(): number {
    return this.connections.size;
  }
} 