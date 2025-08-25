export interface Notification {
  id: string;
  type:
    | 'challenge'
    | 'tournament'
    | 'clan'
    | 'achievement'
    | 'system'
    | 'match_result';
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

export interface NewNotificationEvent {
  type: 'new_notification';
  data: Notification;
}

export interface MarkAsReadResponse {
  success: boolean;
  notificationId: string;
}
