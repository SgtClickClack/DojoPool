import { VectorTimestamp } from "../core/consistency/VectorClock";

export interface GameState {
  tables: Table[];
  players: Player[];
  currentTurn: string;
  gamePhase: string;
  timestamp?: VectorTimestamp;
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
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  type: "cue" | "solid" | "stripe" | "eight";
  pocketed: boolean;
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
  | "ENTRY_COMMITTED";

export interface GameAction {
  type: GameActionType;
  playerId: string;
  tableId: string;
  data?: any;
  timestamp: number;
}

export interface GameEvent {
  action: GameAction;
  timestamp: VectorTimestamp;
  nodeId: string;
}
