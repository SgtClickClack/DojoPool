import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type { ActivityFeedResponse } from '../types/activity';
import type {
  Clan,
  ClanMember,
  ClanSearchFilters,
  CreateClanRequest,
} from '../types/clan';
import type { Match, MatchWithAnalysis } from '../types/match';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest?.url?.includes('auth/refresh')
    ) {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/api/auth/refresh', {
          refresh_token: refreshToken,
        });
        const { token } = response.data;

        localStorage.setItem('auth_token', token);

        if (originalRequest) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Challenge API functions
export const sendChallenge = async (
  defenderId: string,
  stakeCoins: number = 0
) => {
  const response = await api.post('/v1/challenges', {
    challengerId: 'current-user-id', // TODO: Get from auth context
    defenderId,
    stakeCoins,
  });
  return response.data;
};

export const respondToChallenge = async (
  challengeId: string,
  status: 'ACCEPTED' | 'DECLINED'
) => {
  const response = await api.patch(`/v1/challenges/${challengeId}`, { status });
  return response.data;
};

export const getUserChallenges = async (userId: string) => {
  const response = await api.get('/v1/challenges', { params: { userId } });
  return response.data;
};

// Clan API functions
export const createClan = async (
  clanData: CreateClanRequest
): Promise<Clan> => {
  const response = await api.post('/v1/clans', clanData);
  return response.data;
};

export const getClans = async (
  filters?: ClanSearchFilters
): Promise<Clan[]> => {
  const response = await api.get('/v1/clans', { params: filters });
  return response.data;
};

export const getClanDetails = async (clanId: string): Promise<Clan> => {
  const response = await api.get(`/v1/clans/${clanId}`);
  return response.data;
};

export const getClanMembers = async (clanId: string): Promise<ClanMember[]> => {
  const response = await api.get(`/v1/clans/${clanId}/members`);
  return response.data;
};

export const getClanControlledDojos = async (
  clanId: string
): Promise<any[]> => {
  const response = await api.get(`/v1/territories/clan/${clanId}`);
  return response.data;
};

export const joinClan = async (
  clanId: string,
  message?: string
): Promise<void> => {
  const response = await api.post(`/v1/clans/${clanId}/join`, { message });
  return response.data;
};

export const leaveClan = async (clanId: string): Promise<void> => {
  const response = await api.post(`/v1/clans/${clanId}/leave`);
  return response.data;
};

export const getUserClan = async (userId: string): Promise<Clan | null> => {
  try {
    const response = await api.get(`/v1/users/${userId}/clan`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const updateClan = async (
  clanId: string,
  updates: Partial<Clan>
): Promise<Clan> => {
  const response = await api.patch(`/v1/clans/${clanId}`, updates);
  return response.data;
};

export const deleteClan = async (clanId: string): Promise<void> => {
  const response = await api.delete(`/v1/clans/${clanId}`);
  return response.data;
};

// Activity Feed API functions
export const getActivityFeed = async (
  filter: 'global' | 'friends' = 'global',
  page: number = 1,
  limit: number = 20
): Promise<ActivityFeedResponse> => {
  const response = await api.get('/v1/feed', {
    params: { filter, page, limit },
  });
  return response.data;
};

// Match API functions
export const getMatchDetails = async (matchId: string): Promise<Match> => {
  const response = await api.get(`/v1/matches/${matchId}`);
  return response.data;
};

export const getMatchWithAnalysis = async (
  matchId: string
): Promise<MatchWithAnalysis> => {
  const response = await api.get(`/v1/matches/${matchId}/analysis`);
  return response.data;
};

export const finalizeMatch = async (
  matchId: string,
  winnerId: string,
  scoreA: number,
  scoreB: number
): Promise<Match> => {
  const response = await api.put(`/v1/matches/${matchId}/finalize`, {
    winnerId,
    scoreA,
    scoreB,
  });
  return response.data;
};

export default api;
