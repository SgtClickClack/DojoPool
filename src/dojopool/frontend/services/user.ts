import api from './api';
import { UserProfile, UserPreferences, Achievement } from '../../types/user';

export async function getCurrentUser(): Promise<UserProfile> {
    const response = await api.get('/user/profile');
    return response.data;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.put('/user/profile', updates);
    return response.data;
}

export async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await api.put('/user/preferences', preferences);
    return response.data;
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
    const response = await api.get(`/user/${userId}/achievements`);
    return response.data;
}

export async function updateUserAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/user/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    
    return response.data.url;
}

export async function getUserStats(userId: string): Promise<any> {
    const response = await api.get(`/user/${userId}/stats`);
    return response.data;
}

export async function updateNotificationPreferences(preferences: {
    email: boolean;
    push: boolean;
    trainingReminders: boolean;
}): Promise<void> {
    await api.put('/user/notifications', preferences);
}

export async function registerPushSubscription(subscription: PushSubscription): Promise<void> {
    await api.post('/user/push-subscription', subscription);
}

export async function deleteAccount(): Promise<void> {
    await api.delete('/user/account');
}

export async function exportUserData(): Promise<Blob> {
    const response = await api.get('/user/export', {
        responseType: 'blob'
    });
    return response.data;
}

export async function getLeaderboardPosition(userId: string): Promise<{
    rank: number;
    totalUsers: number;
    nearbyUsers: UserProfile[];
}> {
    const response = await api.get(`/user/${userId}/leaderboard-position`);
    return response.data;
}

export async function syncUserData(): Promise<void> {
    await api.post('/user/sync');
}
