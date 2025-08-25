import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { JournalResponse } from '../types/journal';
import {
  MarkAsReadResponse,
  NotificationResponse,
} from '../types/notification';

// Create axios instance with default config
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
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
        const response = await api.post('/auth/refresh', {
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

export const leaveClan = async (clanId: string): Promise<void> => {
  const response = await api.post(`/v1/clans/${clanId}/leave`);
  return response.data;
};

// Activity Feed API functions
export const getActivityFeed = async (
  filter: 'global' | 'friends' = 'global',
  page: number = 1,
  limit: number = 20
): Promise<any> => {
  const mappedFilter = filter === 'global' ? 'all' : 'friends';
  const response = await api.get('/v1/feed', {
    params: { filter: mappedFilter, page, pageSize: limit },
  });
  const raw = response.data || {};

  const items: any[] = Array.isArray(raw.items) ? raw.items : [];
  const pageNumber: number = Number(raw.page ?? page);
  const pageSize: number = Number(raw.pageSize ?? limit);

  const entries = items.map((it: any) => ({
    id: it.id,
    type: it.type,
    title: it.type?.toString().replace(/_/g, ' ') || 'activity',
    description: it.message ?? '',
    userId: it.user?.id ?? it.userId ?? '',
    username: it.user?.username ?? 'Unknown',
    userAvatar: undefined,
    metadata: it.metadata ?? {},
    createdAt: it.createdAt,
    isPublic: true,
  }));

  return {
    entries,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total: entries.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: pageNumber > 1,
    },
  };
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

// Notification API functions
export const getNotifications = async (
  page: number = 1,
  limit: number = 50
): Promise<NotificationResponse> => {
  const response = await api.get('/v1/notifications', {
    params: { page, limit },
  });
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<MarkAsReadResponse> => {
  const response = await api.patch(`/v1/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<{
  success: boolean;
}> => {
  const response = await api.patch('/v1/notifications/read-all');
  return response.data;
};

// Journal API functions
export const getMyJournal = async (
  page: number = 1,
  limit: number = 20
): Promise<JournalResponse> => {
  const response = await api.get('/v1/users/me/journal', {
    params: { page, limit },
  });
  return response.data;
};

// Authentication API functions
export const login = async (credentials: {
  email: string;
  password: string;
}) => {
  const response = await api.post('/v1/auth/login', credentials);
  return response.data;
};

export const register = async (userData: {
  email: string;
  password: string;
  username: string;
}) => {
  const response = await api.post('/v1/auth/register', userData);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/v1/auth/logout');
  return response.data;
};

// Dashboard API functions
export interface DashboardStats {
  matches: {
    total: number;
    won: number;
    lost: number;
    winRate: number;
    thisMonth: number;
  };
  tournaments: {
    total: number;
    won: number;
    joined: number;
    upcoming: number;
  };
  clan: {
    name: string;
    rank: string;
    points: number;
    level: string;
  };
  dojoCoins: {
    balance: number;
    earned: number;
    spent: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: any;
  }>;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.post('/v1/dashboard/stats');
  return response.data;
};

// CDN Cost Dashboard API functions
export interface CdnCostStats {
  totalCost: number;
  monthlyCost: number;
  dailyCost: number;
  bandwidth: {
    total: number;
    average: number;
    peak: number;
  };
  requests: {
    total: number;
    average: number;
    peak: number;
  };
  dailyBreakdown: Array<{
    date: string;
    cost: number;
    bandwidth: number;
    requests: number;
  }>;
  optimization: {
    savings: number;
    recommendations: string[];
  };
}

export const getCdnCostStats = async (): Promise<CdnCostStats> => {
  const response = await api.get('/v1/dashboard/cdn/cost');
  return response.data;
};

// Venue API functions
export const getVenues = async (params?: {
  search?: string;
  city?: string;
  state?: string;
  hasTournaments?: boolean;
  hasFood?: boolean;
  hasBar?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  venues: any[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const response = await api.get('/v1/venues', { params });
  return response.data;
};

// Dojo Upgrade API function
export const upgradeDojo = async (
  venueId: string,
  upgradeType: string
): Promise<any> => {
  const response = await api.post(`/v1/venues/${venueId}/upgrade`, {
    upgradeType,
  });
  return response.data;
};

export const initiateShadowRun = async (
  targetVenueId: string,
  runType: string
) => {
  const response = await api.post('/v1/shadow-runs', {
    targetVenueId,
    runType,
  });
  return response.data;
};

export const getClanShadowRuns = async (clanId: string) => {
  const response = await api.get(`/shadow-runs/clan/${clanId}`);
  return response.data;
};

// Venue Owner Portal API functions
export const updateMyVenue = async (data: {
  description?: string;
  images?: string[];
  hours?: Array<{ day: string; open: string; close: string; isOpen?: boolean }>;
}): Promise<any> => {
  const response = await api.patch('/v1/venues/me', data);
  return response.data;
};

export const getMyVenue = async (): Promise<any> => {
  const response = await api.get('/v1/venues/me');
  return response.data;
};

export const createVenueSpecial = async (data: {
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}): Promise<any> => {
  const response = await api.post('/v1/venues/me/specials', data);
  return response.data;
};

export const getMyVenueSpecials = async (): Promise<any[]> => {
  const response = await api.get('/v1/venues/me/specials');
  return response.data;
};

export const deleteVenueSpecial = async (
  specialId: string
): Promise<{ success: boolean }> => {
  const response = await api.delete(`/v1/venues/me/specials/${specialId}`);
  return response.data;
};

// Match control API functions
export const pauseMatch = async (
  matchId: string
): Promise<{ status: string }> => {
  const response = await api.post(`/v1/matches/${matchId}/pause`);
  return response.data;
};

export const resumeMatch = async (
  matchId: string
): Promise<{ status: string }> => {
  const response = await api.post(`/v1/matches/${matchId}/resume`);
  return response.data;
};
