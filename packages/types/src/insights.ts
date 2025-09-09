export interface MatchInsights {
  id: string;
  matchId: string;
  playerId?: string;
  provider: string;
  fallback: boolean;
  keyMoments: string[];
  strategicInsights: string[];
  playerPerformanceA?: string;
  playerPerformanceB?: string;
  overallAssessment?: string;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlayerInsightsSummary {
  playerId: string;
  summary: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}
