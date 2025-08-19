export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface VenueRef {
  id?: string;
  name: string;
  address?: string;
}

export type TournamentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'draft';
export type TournamentType = 'single_elimination' | 'double_elimination' | 'round_robin' | string;

export interface MatchRef {
  id: string;
  player1: string | null;
  player2: string | null;
  score1: number;
  score2: number;
  winner: string | null;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  type?: TournamentType;
  tournament_type?: string; // backend naming variant
  game_type?: string;
  format?: string;
  entryFee?: number; // camelCase variant
  entry_fee?: number; // snake_case variant from backend
  registrationDeadline?: string;
  divisions?: string[];
  location?: GeoLocation;
  venue?: VenueRef;
  matches?: MatchRef[];
}
