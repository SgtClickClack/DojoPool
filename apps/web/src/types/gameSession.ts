export enum GameSessionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum GameType {
  EIGHT_BALL = 'EIGHT_BALL',
  NINE_BALL = 'NINE_BALL',
  STRAIGHT_POOL = 'STRAIGHT_POOL',
  BANK_POOL = 'BANK_POOL',
  ONE_POCKET = 'ONE_POCKET',
}

export interface GameSession {
  id: string;
  gameId: string;
  venueId?: string;
  status: GameSessionStatus;
  gameType: GameType;
  rules: Record<string, any>;
  startTime: string;
  endTime?: string;
  duration?: number;
  lastUpdated: string;

  // Player management
  playerIds: string[];
  currentPlayerId?: string;

  // Game state
  ballStates: Record<string, string>;
  fouls: Record<string, number>;
  score: Record<string, number>;
  events: any[];

  // Analytics
  totalShots: number;
  totalFouls: number;
  totalFrames: number;

  // Performance metrics
  avgShotTime?: number;
  avgFrameTime?: number;
  peakViewers: number;

  // Network metrics
  connectionQuality?: number;
  latencyStats: Record<string, any>;
  droppedFrames: number;

  // Winner tracking
  winnerId?: string;
}

export interface CreateGameSessionDto {
  gameId: string;
  venueId?: string;
  playerIds: string[];
  gameType: GameType;
  rules: Record<string, any>;
}

export interface GameSessionUpdateDto {
  status?: GameSessionStatus;
  currentPlayerId?: string;
  ballStates?: Record<string, string>;
  fouls?: Record<string, number>;
  score?: Record<string, number>;
  events?: any[];
}

export interface ShotData {
  playerId: string;
  ballId: string;
  velocity: number;
  direction: { x: number; y: number };
  timestamp: Date;
}

export interface FoulData {
  playerId: string;
  foulType: string;
  reason: string;
}

export interface GameEvent {
  type: 'shot' | 'foul' | 'turn_change' | 'ball_pocketed' | 'game_end';
  playerId?: string;
  timestamp: string;
  data?: any;
}
