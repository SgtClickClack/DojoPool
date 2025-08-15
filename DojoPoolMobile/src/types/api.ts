export interface Venue {
  id: string;
  name: string;
  address: string;
  description: string;
  imageUrl: string;
  openingHours: string;
  contact: string;
  tables: number;
  rating: number;
  amenities: string[];
}

export interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  rank: string;
}

export interface Game {
  id: string;
  venueId: string;
  tableNumber: number;
  gameType: 'eight_ball' | 'nine_ball' | 'snooker';
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  players: Player[];
  currentTurn: string | null;
  winner: string | null;
  startTime: string;
  endTime: string | null;
  score: {
    [playerId: string]: number;
  };
  settings: {
    timeLimit: number | null;
    shotClock: number | null;
    handicap: boolean;
  };
}

export interface CreateGameData {
  venueId: string;
  tableNumber: number;
  gameType: 'eight_ball' | 'nine_ball' | 'snooker';
  settings: {
    timeLimit?: number;
    shotClock?: number;
    handicap?: boolean;
  };
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avatarUrl: string;
  wins: number;
  losses: number;
  winRate: number;
  rating: number;
  rank: string;
  streak: number;
} 