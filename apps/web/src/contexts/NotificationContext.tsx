import { useAuth } from '@/hooks/useAuth';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/APIService';
import { websocketService } from '@/services/WebSocketService';
import { Notification, NotificationResponse } from '@/types/notification';
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response: NotificationResponse = await getNotifications();
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch notifications'
      );
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const clearError = () => setError(null);

  // Subscribe to WebSocket events for real-time notifications
  useEffect(() => {
    if (!user) return;

    const unsubscribe = websocketService.subscribe(
      'new_notification',
      (event: any) => {
        if (event.type === 'new_notification' && event.data) {
          const newNotification = event.data as Notification;

          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          setTotalCount((prev) => prev + 1);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch initial notifications when user logs in
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
    }
  }, [user]);

  const value: NotificationContextType = useMemo(
    () => ({
      notifications,
      unreadCount,
      totalCount,
      isLoading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      clearError,
    }),
    [
      notifications,
      unreadCount,
      totalCount,
      isLoading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      clearError,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
