export interface GameState {
  currentPlayer: string;
  score: {
    player1: number;
    player2: number;
  };
  turn: number;
  status: 'waiting' | 'in_progress' | 'completed';
}

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

export interface GameEvent {
  playerId: string;
  shotType: string;
  success: boolean;
  accuracy: number;
  duration: number;
  timestamp: number;
} 