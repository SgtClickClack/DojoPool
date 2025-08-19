export interface Game {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
  players: number;
}

export interface GameState {
  playerId: string;
  totalClues: number;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  clues: {
    id: string;
    text: string;
    isCompleted: boolean;
    location?: {
      latitude: number;
      longitude: number;
    };
  }[];
  score: number;
  timeRemaining: number;
  isActive: boolean;
  completedClues?: string[];
  isComplete?: boolean;
  sessionDuration?: number;
}
