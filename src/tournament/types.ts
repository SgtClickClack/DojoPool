export interface TournamentPlayer {
  id: string;
  name: string;
  rating?: number;
  stats: {
    wins: number;
    losses: number;
    tournamentWins: number;
    averageFinish: number;
  };
  achievements: string[];
}

export interface Match {
  id: string;
  round: number;
  player1: TournamentPlayer;
  player2: TournamentPlayer | null;
  winner: TournamentPlayer | null;
  loser: TournamentPlayer | null;
  status: 'pending' | 'in_progress' | 'complete';
  stats?: {
    duration: number;
    score: string;
    highlights: string[];
  };
}

export interface MatchResult {
  winner: TournamentPlayer;
  loser: TournamentPlayer;
  stats?: {
    duration: number;
    score: string;
    highlights: string[];
  };
}

export interface Tournament {
  getCurrentRoundMatches(): Match[];
  submitMatchResult(matchId: string, result: MatchResult): void;
  getStandings(): TournamentPlayer[];
  getTournamentState(): TournamentState;
}

export interface TournamentState {
  currentRound: number;
  isComplete: boolean;
  bracket: any; // Specific to tournament type
  standings: TournamentPlayer[];
}

export type TournamentFormat = 
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'swiss';

export interface TournamentConfig {
  format: TournamentFormat;
  name: string;
  description?: string;
  maxPlayers: number;
  minPlayers: number;
  startDate: Date;
  endDate?: Date;
  prizePool?: {
    currency: string;
    amounts: number[];
  };
  rules?: {
    matchFormat: string;
    scoring: string;
    tiebreakers: string[];
  };
  venue?: {
    id: string;
    name: string;
    location: string;
    tables: string[];
  };
} 