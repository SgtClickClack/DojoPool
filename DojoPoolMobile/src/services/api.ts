import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Venue, Game, CreateGameData, LeaderboardEntry } from '../types/api';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Handle logout or token refresh here
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post<{ token: string; user: any }>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
  }) => {
    const response = await api.post<{ token: string; user: any }>(
      '/auth/register',
      userData
    );
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<{ user: any }>('/auth/profile');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<{ message: string }>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post<{ message: string }>(
      '/auth/reset-password',
      { token, password }
    );
    return response.data;
  },
};

export const appApi = {
  getVenues: async () => {
    const response = await api.get<Venue[]>('/venues');
    return response.data;
  },

  getVenueDetails: async (venueId: string) => {
    const response = await api.get<Venue>(`/venues/${venueId}`);
    return response.data;
  },

  getGames: async () => {
    const response = await api.get<Game[]>('/games');
    return response.data;
  },

  getGameDetails: async (gameId: string) => {
    const response = await api.get<Game>(`/games/${gameId}`);
    return response.data;
  },

  createGame: async (gameData: CreateGameData) => {
    const response = await api.post<Game>('/games', gameData);
    return response.data;
  },

  joinGame: async (gameId: string) => {
    const response = await api.post<Game>(`/games/${gameId}/join`);
    return response.data;
  },

  leaveGame: async (gameId: string) => {
    const response = await api.post<Game>(`/games/${gameId}/leave`);
    return response.data;
  },

  updateGameStatus: async (gameId: string, status: Game['status']) => {
    const response = await api.patch<Game>(`/games/${gameId}/status`, {
      status,
    });
    return response.data;
  },

  getLeaderboard: async () => {
    const response = await api.get<LeaderboardEntry[]>('/leaderboard');
    return response.data;
  },

  updateProfile: async (
    profileData: Partial<{ name: string; avatarUrl: string }>
  ) => {
    const response = await api.patch<{ user: any }>('/profile', profileData);
    return response.data;
  },
};
