export interface MatchAnalysis {
  keyMoments: string[];
  strategicInsights: string[];
  playerPerformance: {
    playerA: string;
    playerB: string;
  };
  overallAssessment: string;
  recommendations: string[];
}

export interface Match {
  id: string;
  tournamentId: string;
  venueId: string;
  playerAId: string;
  playerBId: string;
  winnerId?: string;
  loserId?: string;
  scoreA?: number;
  scoreB?: number;
  round: number;
  status: string;
  startedAt?: Date;
  endedAt?: Date;
  tableId?: string;
  aiAnalysisJson?: string;
  createdAt: Date;
  updatedAt: Date;

  // Related data (when included)
  playerA?: {
    id: string;
    username: string;
  };
  playerB?: {
    id: string;
    username: string;
  };
  venue?: {
    id: string;
    name: string;
  };
  tournament?: {
    id: string;
    name: string;
  };
}

export interface MatchWithAnalysis extends Match {
  aiAnalysis?: MatchAnalysis;
}
