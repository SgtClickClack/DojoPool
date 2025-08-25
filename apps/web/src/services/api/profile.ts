import apiClient from './apiClient';

export interface UpdateProfileData {
  username?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  displayName?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  profile?: {
    bio?: string;
    avatarUrl?: string;
    location?: string;
    displayName?: string;
  };
}

export const profileApi = {
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiClient.patch<UserProfile>('/users/me', data);
    return response.data;
  },

  getMyProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/users/me');
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<{ avatarUrl: string }>(
      '/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
