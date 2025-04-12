export enum GameState {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum GameType {
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  TOURNAMENT = 'TOURNAMENT',
  PRACTICE = 'PRACTICE'
}

export interface Game {
  id: string;
  player1Id: string;
  player2Id: string;
  type: GameType;
  tableId: string;
  venueId: string;
  state: GameState;
  player1Score?: number;
  player2Score?: number;
  winnerId?: string;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
} 