export interface NodeAddress {
  nodeId: string;
  host: string;
  port: number;
}

export interface NetworkMessage<T = unknown> {
  /** Unique message identifier */
  id: string;
  /** Message type */
  type: NetworkMessageType;
  /** Source node identifier */
  source: string;
  /** Target node identifier */
  target: string;
  /** Message payload */
  payload: T;
  /** Message timestamp */
  timestamp: number;
}

export enum NetworkMessageType {
  APPEND_ENTRIES = 'APPEND_ENTRIES',
  APPEND_ENTRIES_RESPONSE = 'APPEND_ENTRIES_RESPONSE',
  REQUEST_VOTE = 'REQUEST_VOTE',
  REQUEST_VOTE_RESPONSE = 'REQUEST_VOTE_RESPONSE',
  STATE_SYNC = 'STATE_SYNC',
  STATE_SYNC_RESPONSE = 'STATE_SYNC_RESPONSE',
  HEARTBEAT = 'HEARTBEAT',
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
  MESSAGE = 'MESSAGE',
  ERROR = 'ERROR',
}

export interface NetworkTransportConfig {
  nodeId: string;
  port: number;
  peers: NodeAddress[];
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

export interface NetworkStats {
  /** Number of messages sent */
  messagesSent: number;
  /** Number of messages received */
  messagesReceived: number;
  /** Total bytes transferred */
  bytesTransferred: number;
  /** Number of active connections */
  activeConnections: number;
  /** Number of errors encountered */
  errors: number;
  /** Last error that occurred */
  lastError: NetworkError | null;
  /** Number of messages pending delivery */
  pendingMessages: number;
  /** Current message queue size */
  queueSize: number;
  /** Timestamp of last message received */
  lastMessageTimestamp: number;
}

export interface NetworkError {
  code: string;
  message: string;
  timestamp: number;
  details: string;
}

export enum NetworkEvents {
  MESSAGE = 'message',
  ERROR = 'error',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  STATS = 'stats',
}

export interface NetworkTransport {
  send<T>(
    target: string,
    message: Omit<NetworkMessage<T>, 'source' | 'timestamp'>
  ): Promise<void>;
  onMessage(handler: (message: NetworkMessage) => void): void;
  broadcast<T>(
    message: Omit<NetworkMessage<T>, 'source' | 'timestamp' | 'target'>
  ): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export type NetworkEventHandler<T extends any[]> = (...args: T) => void;

export interface NetworkEventMap
  extends Record<string | symbol, NetworkEventHandler<any[]>> {
  connect: (nodeId: string) => void;
  disconnect: (nodeId: string) => void;
  message: (message: NetworkMessage) => void;
  error: (error: NetworkError) => void;
  stateUpdated: (state: unknown) => void;
  stateSyncRequest: (request: {
    nodeId: string;
    state: unknown;
    timestamp: number;
  }) => void;
  'state:change': (state: unknown) => void;
  'leader:elected': (leaderId: string) => void;
  'entry:committed': (entry: unknown) => void;
  [key: string]: NetworkEventHandler<any[]>;
}
