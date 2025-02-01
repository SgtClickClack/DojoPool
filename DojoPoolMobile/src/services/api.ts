import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Handle logout or token refresh here
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },
};

export const appApi = {
  getVenues: async () => {
    const response = await api.get('/venues');
    return response.data;
  },

  getVenueDetails: async (venueId: string) => {
    const response = await api.get(`/venues/${venueId}`);
    return response.data;
  },

  getGames: async () => {
    const response = await api.get('/games');
    return response.data;
  },

  getGameDetails: async (gameId: string) => {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  },

  createGame: async (gameData: any) => {
    const response = await api.post('/games', gameData);
    return response.data;
  },

  joinGame: async (gameId: string) => {
    const response = await api.post(`/games/${gameId}/join`);
    return response.data;
  },

  leaveGame: async (gameId: string) => {
    const response = await api.post(`/games/${gameId}/leave`);
    return response.data;
  },

  updateGameStatus: async (gameId: string, status: string) => {
    const response = await api.patch(`/games/${gameId}/status`, { status });
    return response.data;
  },

  getLeaderboard: async () => {
    const response = await api.get('/leaderboard');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.patch('/profile', profileData);
    return response.data;
  },
}; 