export interface GameResult {
  gameId: string;
  winner: string;
  loser: string;
  score: string; // e.g., "8-5"
  date: string; // ISO string
}

export interface GameSpecificReward {
  id: string;
  name: string;
  description: string;
}
