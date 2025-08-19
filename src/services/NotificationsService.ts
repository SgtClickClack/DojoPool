// Mock types for development
export interface NotificationPreferences {
  enabled: boolean;
  categories: Record<string, boolean>;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

// Mock error handling utility
const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'Unknown error occurred';
};

// Mock API client
const api = {
  get: async (url: string, options?: any): Promise<{ data: any }> => {
    console.log('Mock API GET:', url, options);
    if (url === '/notifications/count') {
      return { data: { total: 0, unread: 0 } };
    }
    if (url === '/notifications/settings') {
      return {
        data: {
          preferences: {},
          channels: { push: false, email: false, inApp: false },
        },
      };
    }
    if (url === '/notifications') {
      return { data: [] as Notification[] };
    }
    return { data: [] };
  },
  post: async (url: string, data?: any): Promise<{ data: any }> => {
    console.log('Mock API POST:', url, data);
    return { data: null };
  },
  put: async (url: string, data: any): Promise<{ data: any }> => {
    console.log('Mock API PUT:', url, data);
    return { data: data };
  },
  delete: async (url: string): Promise<{ data: any }> => {
    console.log('Mock API DELETE:', url);
    return { data: null };
  },
};

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  priority: 'low' | 'medium' | 'high';
  actions?: NotificationAction[];
}

export type NotificationType =
  | 'achievement'
  | 'challenge'
  | 'training_reminder'
  | 'leaderboard_update'
  | 'milestone'
  | 'system'
  | 'social';

export interface NotificationAction {
  label: string;
  action: string;
  url?: string;
  data?: Record<string, any>;
}

export interface NotificationFilter {
  type?: NotificationType[];
  read?: boolean;
  startDate?: string;
  endDate?: string;
}

export async function getNotifications(
  filters?: NotificationFilter
): Promise<Notification[]> {
  try {
    const response = await api.get('/notifications', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Failed to get notifications:', getErrorMessage(error));
    throw new Error(`Failed to get notifications: ${getErrorMessage(error)}`);
  }
}

export async function markAsRead(
  notificationId: string | string[]
): Promise<void> {
  try {
    const ids = Array.isArray(notificationId)
      ? notificationId
      : [notificationId];
    await api.post('/notifications/mark-read', { ids });
  } catch (error) {
    console.error(
      'Failed to mark notifications as read:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to mark notifications as read: ${getErrorMessage(error)}`
    );
  }
}

export async function markAllAsRead(): Promise<void> {
  try {
    await api.post('/notifications/mark-all-read');
  } catch (error) {
    console.error(
      'Failed to mark all notifications as read:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to mark all notifications as read: ${getErrorMessage(error)}`
    );
  }
}

export async function deleteNotification(
  notificationId: string
): Promise<void> {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (error) {
    console.error('Failed to delete notification:', getErrorMessage(error));
    throw new Error(`Failed to delete notification: ${getErrorMessage(error)}`);
  }
}

export async function clearAllNotifications(): Promise<void> {
  try {
    await api.delete('/notifications/clear-all');
  } catch (error) {
    console.error('Failed to clear all notifications:', getErrorMessage(error));
    throw new Error(
      `Failed to clear all notifications: ${getErrorMessage(error)}`
    );
  }
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  try {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  } catch (error) {
    console.error(
      'Failed to update notification preferences:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to update notification preferences: ${getErrorMessage(error)}`
    );
  }
}

export async function registerPushEndpoint(
  subscription: PushSubscription
): Promise<void> {
  try {
    await api.post('/notifications/push-endpoint', subscription);
  } catch (error) {
    console.error('Failed to register push endpoint:', getErrorMessage(error));
    throw new Error(
      `Failed to register push endpoint: ${getErrorMessage(error)}`
    );
  }
}

export async function unregisterPushEndpoint(): Promise<void> {
  try {
    await api.delete('/notifications/push-endpoint');
  } catch (error) {
    console.error(
      'Failed to unregister push endpoint:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to unregister push endpoint: ${getErrorMessage(error)}`
    );
  }
}

export async function testNotification(): Promise<void> {
  try {
    await api.post('/notifications/test');
  } catch (error) {
    console.error('Failed to test notification:', getErrorMessage(error));
    throw new Error(`Failed to test notification: ${getErrorMessage(error)}`);
  }
}

export async function getNotificationCount(): Promise<{
  total: number;
  unread: number;
}> {
  try {
    const response = await api.get('/notifications/count');
    return response.data;
  } catch (error) {
    console.error('Failed to get notification count:', getErrorMessage(error));
    throw new Error(
      `Failed to get notification count: ${getErrorMessage(error)}`
    );
  }
}

export async function snoozeNotification(
  notificationId: string,
  duration: number
): Promise<void> {
  try {
    await api.post(`/notifications/${notificationId}/snooze`, { duration });
  } catch (error) {
    console.error('Failed to snooze notification:', getErrorMessage(error));
    throw new Error(`Failed to snooze notification: ${getErrorMessage(error)}`);
  }
}

export async function getNotificationSettings(): Promise<{
  preferences: NotificationPreferences;
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
}> {
  try {
    const response = await api.get('/notifications/settings');
    return response.data;
  } catch (error) {
    console.error(
      'Failed to get notification settings:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to get notification settings: ${getErrorMessage(error)}`
    );
  }
}

export async function updateNotificationSettings(settings: {
  preferences?: Partial<NotificationPreferences>;
  channels?: {
    push?: boolean;
    email?: boolean;
    inApp?: boolean;
  };
}): Promise<void> {
  try {
    await api.put('/notifications/settings', settings);
  } catch (error) {
    console.error(
      'Failed to update notification settings:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to update notification settings: ${getErrorMessage(error)}`
    );
  }
}
