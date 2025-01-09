import apiClient from './client';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  gamesCompleted: number;
  achievements: string[];
}

export type LeaderboardPeriod = 'all' | 'month' | 'week';

export const leaderboardApi = {
  getLeaderboard: async (
    period: LeaderboardPeriod = 'all',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<LeaderboardEntry[]>('/leaderboard', {
      params: { period, limit },
    });
    return response.data;
  },

  getUserRank: async (
    userId: string,
    period: LeaderboardPeriod = 'all'
  ): Promise<{
    rank: number;
    score: number;
    totalPlayers: number;
  }> => {
    const response = await apiClient.get<{
      rank: number;
      score: number;
      totalPlayers: number;
    }>(`/leaderboard/users/${userId}/rank`, {
      params: { period },
    });
    return response.data;
  },

  getGameLeaderboard: async (
    gameId: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<LeaderboardEntry[]>(
      `/leaderboard/games/${gameId}`,
      {
        params: { limit },
      }
    );
    return response.data;
  },
}; 