/**
 * TypeScript interfaces for the WebSocket manager.
 */

export enum ConnectionState {
  INITIALIZING = "initializing",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
}

export interface SocketManagerOptions {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  debug: boolean;
  timeout: number;
}

export interface Message<T = any> {
  type: string;
  payload: T;
  timestamp: string;
}

export interface ConnectionStatus {
  state: ConnectionState;
  lastError: string | null;
  lastEventTime: string;
}

export interface SocketManager {
  connect(): Promise<void>;
  disconnect(): void;
  subscribe<T = any>(type: string, callback: (data: T) => void): void;
  unsubscribe<T = any>(type: string, callback: (data: T) => void): void;
  send<T = any>(type: string, payload: T): Promise<void>;
  getConnectionState(): ConnectionStatus;
}
