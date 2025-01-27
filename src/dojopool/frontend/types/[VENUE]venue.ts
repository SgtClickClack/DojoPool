export interface Venue {
  id: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  hours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  features?: string[];
  tables: number;
  pricing?: {
    [key: string]: number;
  };
  rating: number;
  total_ratings: number;
  is_verified: boolean;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VenueCheckIn {
  id: number;
  venue_id: number;
  user_id: number;
  table_number?: number;
  game_type?: string;
  checked_in_at: string;
  checked_out_at?: string;
}

export interface LeaderboardEntry {
  id: number;
  venue_id: number;
  user_id: number;
  username: string;
  avatar_url?: string;
  points: number;
  wins: number;
  losses: number;
  current_streak: number;
  highest_streak: number;
  last_played: string;
}

export interface VenueEvent {
  id: number;
  venue_id: number;
  name: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  registration_deadline?: string;
  max_participants?: number;
  entry_fee: number;
  prize_pool: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  participants?: VenueEventParticipant[];
}

export interface VenueEventParticipant {
  id: number;
  event_id: number;
  user_id: number;
  registered_at: string;
  checked_in: boolean;
  checked_in_at?: string;
  placement?: number;
  prize_amount?: number;
  user?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
}
