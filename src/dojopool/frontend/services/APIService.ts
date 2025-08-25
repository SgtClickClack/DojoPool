import axios, { type AxiosError, type AxiosInstance } from 'axios';

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

export default api;

// Clan API functions
export const createClan = async (clanData: any): Promise<any> => {
  const response = await api.post('/v1/clans', clanData);
  return response.data;
};

export const getClans = async (filters?: any): Promise<any[]> => {
  const response = await api.get('/v1/clans', { params: filters });
  return response.data;
};

export const getClanDetails = async (clanId: string): Promise<any> => {
  const response = await api.get(`/v1/clans/${clanId}`);
  return response.data;
};

export const getClanMembers = async (clanId: string): Promise<any[]> => {
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

export const leaveClan = async (
  clanId: string
): Promise<void> => {
  const response = await api.post(`/v1/clans/${clanId}/leave`);
  return response.data;
};

// Activity Feed API functions
export const getActivityFeed = async (
  filter: 'global' | 'friends' = 'global',
  page: number = 1,
  limit: number = 20
): Promise<any> => {
  const response = await api.get('/v1/feed', {
    params: { filter, page, limit }
  });
  return response.data;
};

export const getUserClan = async (userId: string): Promise<any | null> => {
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
  updates: any
): Promise<any> => {
  const response = await api.patch(`/v1/clans/${clanId}`, updates);
  return response.data;
};

export const deleteClan = async (clanId: string): Promise<void> => {
  const response = await api.delete(`/v1/clans/${clanId}`);
  return response.data;
};
