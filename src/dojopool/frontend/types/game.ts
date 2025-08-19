export enum BallStatus {
  ON_TABLE = 'ON_TABLE',
  POCKETED = 'POCKETED',
  SCRATCHED = 'SCRATCHED',
}

export enum GameStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PlayerType {
  STRIPES = 'STRIPES',
  SOLIDS = 'SOLIDS',
  UNDECIDED = 'UNDECIDED',
}

export interface Player {
  id: string;
  name: string;
  score: number;
  type: PlayerType;
  ballsPocketed: number[];
  fouls: number;
}

export interface GameState {
  id: string;
  status: GameStatus;
  player1: Player;
  player2: Player;
  currentTurn: string; // player ID
  ballStatuses: Record<number, BallStatus>;
  winner?: string; // player ID
  startTime: Date;
  endTime?: Date;
  venue: {
    id: string;
    name: string;
    tableNumber: number;
  };
}

export interface GameStats {
  totalShots: number;
  successfulShots: number;
  fouls: number;
  averagePositioning: number;
  longestStreak: number;
  gameLength: number; // in minutes
}

export interface GameHistory {
  id: string;
  timestamp: Date;
  player: string; // player ID
  action: string;
  details: Record<string, any>;
}
