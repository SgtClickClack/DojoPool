/**
 * Vector timestamp representation
 */
export interface VectorTimestamp {
  [nodeId: string]: number;
}

/**
 * CRDT value wrapper with vector timestamp
 */
export interface CRDTValue<T> {
  value: T;
  timestamp: VectorTimestamp;
}

/**
 * Game state interface
 */
export interface GameState {
  score: number;
  maxScore: number;
  currentPlayer: string;
  previousPlayer: string;
  timestamp: VectorTimestamp;
  gameId: string;
  status: GameStatus;
  moves: GameMove[];
}

/**
 * Game status enumeration
 */
export enum GameStatus {
  WAITING = "WAITING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  PAUSED = "PAUSED",
  ERROR = "ERROR",
}

/**
 * Game move interface
 */
export interface GameMove {
  playerId: string;
  moveType: string;
  timestamp: VectorTimestamp;
  position?: { x: number; y: number };
  score?: number;
}

/**
 * Consistency metrics interface
 */
export interface ConsistencyMetrics {
  latency: number;
  level: ConsistencyLevel;
  nodes: number;
  conflicts: number;
  resolutionTime: number;
  timestamp: number;
}

/**
 * Consistency level enumeration
 */
export enum ConsistencyLevel {
  STRONG = "STRONG",
  EVENTUAL = "EVENTUAL",
  CAUSAL = "CAUSAL",
  SESSION = "SESSION",
}

/**
 * Invariant check result interface
 */
export interface InvariantResult {
  name: string;
  valid: boolean;
  timestamp: number;
  details?: string;
}

export interface ConsensusMessage {
  type:
    | "HEARTBEAT"
    | "VOTE_REQUEST"
    | "VOTE_RESPONSE"
    | "LOG_ENTRY"
    | "LOG_COMMIT";
  term: number;
  senderId: string;
  vectorClock: VectorTimestamp;
  payload?: any;
}

export interface LogEntry {
  term: number;
  index: number;
  command: string;
  data: any;
  vectorClock: VectorTimestamp;
}
