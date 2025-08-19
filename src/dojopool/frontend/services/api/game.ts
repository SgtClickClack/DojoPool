import { type Game, type GameState } from '@/types/game';
import apiClient from './client';

export interface CreateGameResponse {
  gameId: string;
  inviteCode: string;
}

export interface JoinGameResponse {
  game: Game;
  initialState: GameState;
}

export interface GameProgress {
  clueId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  qrCode?: string;
}

export const gameApi = {
  listGames: async (): Promise<Game[]> => {
    const response = await apiClient.get<Game[]>('/games');
    return response.data;
  },

  getGame: async (gameId: string): Promise<Game> => {
    const response = await apiClient.get<Game>(`/games/${gameId}`);
    return response.data;
  },

  createGame: async (data: {
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    duration: string;
    maxPlayers: number;
    clues: {
      text: string;
      location?: {
        latitude: number;
        longitude: number;
      };
      qrCode?: string;
    }[];
  }): Promise<CreateGameResponse> => {
    const response = await apiClient.post<CreateGameResponse>('/games', data);
    return response.data;
  },

  joinGame: async (gameId: string): Promise<JoinGameResponse> => {
    const response = await apiClient.post<JoinGameResponse>(
      `/games/${gameId}/join`
    );
    return response.data;
  },

  getGameState: async (gameId: string): Promise<GameState> => {
    const response = await apiClient.get<GameState>(`/games/${gameId}/state`);
    return response.data;
  },

  updateProgress: async (
    gameId: string,
    progress: GameProgress
  ): Promise<GameState> => {
    const response = await apiClient.post<GameState>(
      `/games/${gameId}/progress`,
      progress
    );
    return response.data;
  },

  verifyQRCode: async (
    gameId: string,
    data: { clueId: string; qrCode: string }
  ): Promise<{ isValid: boolean; message?: string }> => {
    const response = await apiClient.post<{
      isValid: boolean;
      message?: string;
    }>(`/games/${gameId}/verify-qr`, data);
    return response.data;
  },

  leaveGame: async (gameId: string): Promise<void> => {
    await apiClient.post(`/games/${gameId}/leave`);
  },

  endGame: async (
    gameId: string
  ): Promise<{
    finalScore: number;
    completedClues: number;
    timeTaken: string;
  }> => {
    const response = await apiClient.post<{
      finalScore: number;
      completedClues: number;
      timeTaken: string;
    }>(`/games/${gameId}/end`);
    return response.data;
  },
};
