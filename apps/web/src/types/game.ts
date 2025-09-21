export interface Game {
  id: string;
  player1Id: string;
  player2Id: string;
  venueId: string;
  status: GameStatus;
  score: GameScore;
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameState {
  currentPlayer: string;
  ballsRemaining: number[];
  fouls: Foul[];
  lastShot: Shot;
  gamePhase: GamePhase;
}

export interface GameScore {
  player1: number;
  player2: number;
}

export interface Shot {
  playerId: string;
  ballHit: number;
  ballPocketed: number[];
  isFoul: boolean;
  timestamp: Date;
}

export interface Foul {
  playerId: string;
  type: FoulType;
  description: string;
  timestamp: Date;
}

export enum GameStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Export individual enum values for use in other files
export const { PENDING, ACTIVE, COMPLETED, CANCELLED } = GameStatus;

export enum GamePhase {
  BREAK = 'break',
  PLAY = 'play',
  END_GAME = 'end_game',
}

// Export individual enum values for use in other files
export const { BREAK, PLAY, END_GAME } = GamePhase;

export enum FoulType {
  SCRATCH = 'scratch',
  ILLEGAL_SHOT = 'illegal_shot',
  WRONG_BALL = 'wrong_ball',
  JUMP_SHOT = 'jump_shot',
}

// Export individual enum values for use in other files
export const { SCRATCH, ILLEGAL_SHOT, WRONG_BALL, JUMP_SHOT } = FoulType;
