import { type User } from '../../types/[AUTH]auth';
import apiClient from './client';

export interface UserProfile extends User {
  stats: {
    totalGames: number;
    gamesWon: number;
    totalScore: number;
    averageTime: string;
  };
  achievements: {
    id: string;
    title: string;
    description: string;
    date: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }[];
  recentGames: {
    id: string;
    title: string;
    date: string;
    score: number;
    result: 'won' | 'lost' | 'abandoned';
  }[];
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  avatarUrl?: string;
}

export const profileApi = {
  getProfile: async (userId: string): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>(`/profiles/${userId}`);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>('/profiles/me', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<{ avatarUrl: string }>(
      '/profiles/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getAchievements: async (
    userId: string
  ): Promise<UserProfile['achievements']> => {
    const response = await apiClient.get<UserProfile['achievements']>(
      `/profiles/${userId}/achievements`
    );
    return response.data;
  },

  getGameHistory: async (
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    games: UserProfile['recentGames'];
    total: number;
    hasMore: boolean;
  }> => {
    const response = await apiClient.get<{
      games: UserProfile['recentGames'];
      total: number;
      hasMore: boolean;
    }>(`/profiles/${userId}/games`, {
      params: { page, limit },
    });
    return response.data;
  },

  getStats: async (userId: string): Promise<UserProfile['stats']> => {
    const response = await apiClient.get<UserProfile['stats']>(
      `/profiles/${userId}/stats`
    );
    return response.data;
  },
};
