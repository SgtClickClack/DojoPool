import apiClient from '@/services/api/client';
import {
  type LoginCredentials,
  type RegisterData,
  type User,
} from '@/types/[AUTH]auth';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Admin API interfaces
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  totalTournaments: number;
  totalRevenue: number;
  activeDojos: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'banned' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await apiClient.put('/auth/password', data);
  },

  // Admin API functions
  getAdminStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>('/admin/stats');
    return response.data;
  },

  getAllUsers: async (
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string
  ): Promise<AdminUserListResponse> => {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;

    const response = await apiClient.get<AdminUserListResponse>(
      '/admin/users',
      {
        params,
      }
    );
    return response.data;
  },

  banUser: async (userId: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/ban`, { reason });
  },

  unbanUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/unban`);
  },

  suspendUser: async (
    userId: string,
    duration: number,
    reason?: string
  ): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/suspend`, {
      duration,
      reason,
    });
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  updateUserRole: async (userId: string, role: string): Promise<void> => {
    await apiClient.patch(`/admin/users/${userId}/role`, { role });
  },
};
