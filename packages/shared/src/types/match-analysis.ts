// Shared types for AI-powered match analysis and player insights

export interface MatchAnalysisData {
  keyMoments: string[];
  strategicInsights: string[];
  playerPerformance: {
    playerA: string;
    playerB: string;
  };
  overallAssessment: string;
  recommendations: string[];
}

export interface MatchInsights {
  id: string;
  matchId: string;
  provider: string;
  fallback: boolean;
  keyMoments: string[];
  strategicInsights: string[];
  playerPerformanceA: string | null;
  playerPerformanceB: string | null;
  overallAssessment: string | null;
  recommendations: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  match?: {
    id: string;
    scoreA: number | null;
    scoreB: number | null;
    winnerId: string | null;
    tournament?: {
      name: string;
    };
    venue?: {
      name: string;
    };
    playerA?: {
      username: string;
    };
    playerB?: {
      username: string;
    };
  };
}

export interface PlayerInsightsSummary {
  playerId: string;
  summary: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  trends?: {
    recentPerformance: number[];
    skillProgression: number[];
    venuePerformance: Record<string, number>;
  };
  strengths?: string[];
  areasForImprovement?: string[];
}

export interface MatchAnalysisRequest {
  playerAName: string;
  playerBName: string;
  scoreA: number;
  scoreB: number;
  winner: string;
  shots?: any[];
  venue: string;
  round: number;
}

export interface ShotAnalysis {
  matchId: string;
  playerId: string;
  ballSunk?: string | number | boolean | null;
  wasFoul?: boolean;
  timestamp?: Date;
  position?: {
    x: number;
    y: number;
  };
  difficulty?: number;
  commentary?: string;
}

export interface PlayerPerformanceMetrics {
  playerId: string;
  matchId: string;
  accuracy: number;
  consistency: number;
  positioning: number;
  strategy: number;
  mentalGame: number;
  overallRating: number;
  keyShots: ShotAnalysis[];
  mistakes: string[];
  strengths: string[];
}

export interface VenueInsights {
  venueId: string;
  name: string;
  playerPerformance: Record<string, number>;
  popularTimes: string[];
  difficultyRating: number;
  commonPatterns: string[];
}

export interface TournamentInsights {
  tournamentId: string;
  name: string;
  format: string;
  playerRankings: Array<{
    playerId: string;
    username: string;
    points: number;
    position: number;
  }>;
  keyMoments: string[];
  strategicObservations: string[];
}
