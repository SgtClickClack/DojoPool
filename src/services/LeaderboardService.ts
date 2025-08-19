import { getErrorMessage } from '../utils/errorHandling';
import { apiClient as api } from './api';

// Mock UserProfile interface for development
interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  user: Pick<UserProfile, 'id' | 'username'>;
  rank: number;
  points: number;
  level: number;
  recentAchievements: string[];
  trainingStreak: number;
}

export interface LeaderboardFilters {
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  style?: string;
  skillLevel?: number;
  region?: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalParticipants: number;
  userRank?: number;
  lastUpdated: string;
}

export async function getLeaderboard(
  filters?: LeaderboardFilters
): Promise<LeaderboardResponse> {
  try {
    const response = await api.get('/leaderboard', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Failed to get leaderboard:', getErrorMessage(error));
    throw new Error(`Failed to get leaderboard: ${getErrorMessage(error)}`);
  }
}

export async function getUserRanking(userId: string): Promise<{
  rank: number;
  points: number;
  nearbyUsers: LeaderboardEntry[];
}> {
  try {
    const response = await api.get(`/leaderboard/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get user ranking:', getErrorMessage(error));
    throw new Error(`Failed to get user ranking: ${getErrorMessage(error)}`);
  }
}

export async function getStyleLeaders(
  style: string
): Promise<LeaderboardEntry[]> {
  try {
    const response = await api.get(`/leaderboard/style/${style}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get style leaders:', getErrorMessage(error));
    throw new Error(`Failed to get style leaders: ${getErrorMessage(error)}`);
  }
}

export async function getRegionalLeaderboard(
  region: string
): Promise<LeaderboardResponse> {
  try {
    const response = await api.get(`/leaderboard/region/${region}`);
    return response.data;
  } catch (error) {
    console.error(
      'Failed to get regional leaderboard:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to get regional leaderboard: ${getErrorMessage(error)}`
    );
  }
}

export async function getLeaderboardHistory(userId: string): Promise<{
  rankHistory: Array<{ date: string; rank: number }>;
  pointsHistory: Array<{ date: string; points: number }>;
}> {
  try {
    const response = await api.get(`/leaderboard/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get leaderboard history:', getErrorMessage(error));
    throw new Error(
      `Failed to get leaderboard history: ${getErrorMessage(error)}`
    );
  }
}

export async function subscribeToLeaderboardUpdates(
  userId: string
): Promise<void> {
  try {
    await api.post('/leaderboard/subscribe', { userId });
  } catch (error) {
    console.error(
      'Failed to subscribe to leaderboard updates:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to subscribe to leaderboard updates: ${getErrorMessage(error)}`
    );
  }
}

export async function unsubscribeFromLeaderboardUpdates(
  userId: string
): Promise<void> {
  try {
    await api.post('/leaderboard/unsubscribe', { userId });
  } catch (error) {
    console.error(
      'Failed to unsubscribe from leaderboard updates:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to unsubscribe from leaderboard updates: ${getErrorMessage(
        error
      )}`
    );
  }
}

export async function getLeaderboardStats(): Promise<{
  totalParticipants: number;
  averageLevel: number;
  topStyles: Array<{ style: string; count: number }>;
  mostActiveRegions: Array<{ region: string; participants: number }>;
}> {
  try {
    const response = await api.get('/leaderboard/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to get leaderboard stats:', getErrorMessage(error));
    throw new Error(
      `Failed to get leaderboard stats: ${getErrorMessage(error)}`
    );
  }
}

export async function getChallengeLeaderboard(challengeId: string): Promise<{
  entries: Array<{
    user: Pick<UserProfile, 'id' | 'username'>;
    score: number;
    completionTime: number;
    rank: number;
  }>;
  totalParticipants: number;
}> {
  try {
    const response = await api.get(`/leaderboard/challenge/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error(
      'Failed to get challenge leaderboard:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to get challenge leaderboard: ${getErrorMessage(error)}`
    );
  }
}
