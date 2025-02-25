export type TournamentFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'swiss';
export type TournamentStatus =
  | 'pending'
  | 'registration'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'walkover' | 'cancelled';

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  venue_id: number;
  format: TournamentFormat;
  status: TournamentStatus;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  max_participants?: number;
  entry_fee: number;
  prize_pool: number;
  rules?: string;
  bracket_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TournamentParticipant {
  id: number;
  tournament_id: number;
  user_id: number;
  username: string;
  avatar_url?: string;
  seed?: number;
  registered_at: string;
  checked_in: boolean;
  checked_in_at?: string;
  eliminated: boolean;
  final_rank?: number;
  prize_amount?: number;
  stats?: Record<string, any>;
}

export interface TournamentMatch {
  id: number;
  tournament_id: number;
  round_number: number;
  match_number: number;
  player1_id?: number;
  player2_id?: number;
  winner_id?: number;
  next_match_id?: number;
  status: MatchStatus;
  start_time?: string;
  end_time?: string;
  table_number?: number;
  score?: Record<string, any>;
  stats?: Record<string, any>;
  notes?: string;
  player1?: TournamentParticipant;
  player2?: TournamentParticipant;
  winner?: TournamentParticipant;
}

export interface TournamentFilters {
  venue_id?: number;
  status?: TournamentStatus;
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  venue_id: number;
  format: TournamentFormat;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  max_participants?: number;
  entry_fee?: number;
  prize_pool?: number;
  rules?: string;
}

export interface UpdateMatchData {
  winner_id?: number;
  start_time?: string;
  end_time?: string;
  table_number?: number;
  score?: Record<string, any>;
  stats?: Record<string, any>;
  notes?: string;
}
