// AI Types for Dojo Pool
export interface TableBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface BallPosition {
  id: number | string;
  x: number;
  y: number;
  type: 'solid' | 'stripe' | '8-ball' | 'cue-ball' | 'unknown';
  confidence?: number;
  color?: string;
}

export interface ShotData {
  matchId: string;
  playerId: string;
  playerName?: string;
  ballSunk?: string | number | boolean | null;
  wasFoul?: boolean;
  shotType?: string;
  position?: {
    x: number;
    y: number;
  };
  timestamp?: number;
}

export interface MatchData {
  playerAName: string;
  playerBName: string;
  scoreA: number;
  scoreB: number;
  winner: string;
  shots?: ShotData[];
  venue: string;
  round: number;
}

export interface AiConfiguration {
  providers: {
    gemini: {
      enabled: boolean;
      apiKey?: string;
      model?: string;
    };
    openai: {
      enabled: boolean;
      apiKey?: string;
      model?: string;
    };
  };
  fallback: boolean;
  timeout: number;
  retryAttempts: number;
}

// Default export to ensure this is recognized as a module
export default {};
