import { VectorTimestamp } from "../core/consistency/VectorClock.js";

export interface GameState {
  tables: Table[];
  players: Player[];
  currentTurn: string;
  gamePhase: string;
  timestamp?: VectorTimestamp;
  score: {
    home: number;
    away: number;
  };
  time: {
    minutes: number;
    seconds: number;
  };
  possession: string; // team id
  // Additional fields for analysis service
  currentPlayer?: string;
  turn?: number;
  status?: string;
  player1?: number;
  player2?: number;
}

export enum GameType {
  SINGLES = "SINGLES",
  DOUBLES = "DOUBLES",
  TOURNAMENT = "TOURNAMENT",
  PRACTICE = "PRACTICE",
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  score: number;
  isActive: boolean;
  lastAction: number;
}

export interface Table {
  id: string;
  name: string;
  players: string[];
  status: "open" | "active" | "finished";
  currentGame?: Game;
}

export interface Game {
  id: string;
  players: string[];
  currentTurn: string;
  balls: Ball[];
  score: {
    [playerId: string]: number;
  };
  status: "setup" | "active" | "finished";
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  color: string;
  number?: number;
}

export type GameActionType =
  | "CREATE_TABLE"
  | "JOIN_TABLE"
  | "LEAVE_TABLE"
  | "START_GAME"
  | "MAKE_SHOT"
  | "END_GAME"
  | "STATE_UPDATE"
  | "STATE_SYNC"
  | "CONSENSUS_STATE_CHANGE"
  | "LEADER_ELECTED"
  | "ENTRY_COMMITTED"
  | "CHANGE_TURN"
  | "PLACE_BALL";

export interface GameAction {
  type: GameActionType;
  playerId: string;
  tableId: string;
  data?: any;
  timestamp: number;
}

export interface GameEvent {
  type: string;
  description: string;
  timestamp: number;
  playerId?: string;
  teamId?: string;
  shotType?: string;
  success?: boolean;
  accuracy?: number;
  duration?: number;
}

export interface RuleViolation {
  type: string;
  players: string[];
  severity: 'minor' | 'major';
  action: string;
  rule: string;
}

// Added for Game Results Page
export interface GameResult {
  gameId: string;
  winner: string; // Typically player ID
  loser: string;  // Typically player ID
  score: string; // e.g., "8-5"
  date: string;  // Consider ISO string format
  // Optional fields based on needs:
  // duration?: number; // in seconds or minutes
  // tournamentId?: string;
  // matchId?: string;
}

export interface GameSpecificReward {
  id: string;
  name: string;
  description: string;
  // type?: 'COIN' | 'NFT_SHARD' | 'ITEM_UNLOCK' | 'XP'; // More specific reward types
  // amount?: number; // For countable rewards like coins or XP
  // relatedGameId?: string; // To link back to the game
}

// Added for GameAnalysisService
export interface PlayerStats {
  shotsTaken: number;
  successfulShots: number;
  averageAccuracy: number;
  preferredShotTypes: Map<string, number>;
  weaknesses: Set<string>;
  currentStreak: number;
  longestStreak: number;
}

export interface MatchStats {
  totalShots: number;
  successfulShots: number;
  averageShotTime: number;
  longestStreak: number;
  currentStreak: number;
}
