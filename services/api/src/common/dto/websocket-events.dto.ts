// WebSocket Event DTOs for all gateway types

// Common types
export interface BaseEventPayload {
  timestamp?: Date;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

// World Map Gateway DTOs
export interface ResourceRate {
  [key: string]: number;
}

export interface ResourceData {
  [key: string]: number;
}

export interface ResourceTickData {
  ts: string;
}

// Matches Gateway DTOs
export interface MatchUpdateData {
  status?: string;
  score?: {
    player1: number;
    player2: number;
  };
  currentPlayer?: string;
  gameState?: string;
  [key: string]: unknown;
}

export interface TableData {
  id: string;
  status: 'available' | 'occupied' | 'maintenance';
  players?: string[];
  matchId?: string;
  [key: string]: unknown;
}

export interface ShotTakenData {
  matchId: string;
  playerId: string;
  ballSunk: boolean | null;
  wasFoul: boolean;
  playerName?: string;
  shotType?: string;
  [key: string]: unknown;
}

// Tournaments Gateway DTOs
export interface TournamentActionData {
  action: string;
  data: {
    tournamentId?: string;
    playerId?: string;
    matchId?: string;
    [key: string]: unknown;
  };
}

export interface MatchResultData {
  matchId: string;
  result: {
    tournamentId?: string;
    scoreA?: number;
    scoreB?: number;
    winnerId?: string;
    [key: string]: unknown;
  };
}

export interface TournamentUpdateData {
  type: string;
  tournamentId: string;
  data: {
    [key: string]: unknown;
  };
  timestamp: Date;
}

export interface MatchUpdatePayload {
  matchId: string;
  tournamentId?: string;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  status: string;
  timestamp: Date;
}

export interface ParticipantUpdateData {
  tournamentId: string;
  playerId: string;
  action: 'registered' | 'unregistered';
  timestamp: Date;
}

// Chat Gateway DTOs
export interface SocketHeaders {
  [key: string]: string | string[] | undefined;
}

export interface SocketAuth {
  userId?: string;
  [key: string]: unknown;
}

// Activity Events Gateway DTOs
export interface ActivityEventPayload {
  type: string;
  userId?: string;
  data: {
    [key: string]: unknown;
  };
  timestamp: Date;
}

// Common WebSocket message structure
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp?: Date;
}
