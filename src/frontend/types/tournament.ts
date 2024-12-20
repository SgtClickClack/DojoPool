export type TournamentStatus = 'upcoming' | 'registration_open' | 'in_progress' | 'completed' | 'cancelled';
export type ParticipantStatus = 'registered' | 'checked_in' | 'eliminated' | 'active' | 'winner';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type PrizeStatus = 'pending' | 'distributed' | 'claimed';

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  organizer_id: number;
  venue_id: number;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: number;
  entry_fee: number;
  total_prize_pool: number;
  status: TournamentStatus;
  rules?: string;
  created_at: string;
  updated_at: string;
  brackets: TournamentBracket[];
  prizes: TournamentPrize[];
}

export interface TournamentParticipant {
  id: number;
  tournament_id: number;
  user_id: number;
  username: string;
  registration_date: string;
  seed?: number;
  status: ParticipantStatus;
  payment_status: PaymentStatus;
}

export interface TournamentBracket {
  id: number;
  tournament_id: number;
  name: string;
  round_number: number;
  is_active: boolean;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: number;
  bracket_id: number;
  bracket_name: string;
  table_number?: number;
  scheduled_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  status: MatchStatus;
  winner_id?: number;
  score?: string;
  next_match_id?: number;
  players: TournamentParticipant[];
}

export interface TournamentPrize {
  id: number;
  tournament_id: number;
  position: number;
  prize_amount: number;
  prize_description?: string;
  winner_id?: number;
  distribution_status: PrizeStatus;
  distributed_at?: string;
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  venue_id: string;
  start_date: Date;
  end_date: Date;
  registration_deadline: Date;
  max_participants: number;
  entry_fee: number;
  total_prize_pool: number;
  rules?: string;
}

export interface UpdateMatchResultData {
  winner_id: number;
  score: string;
} 