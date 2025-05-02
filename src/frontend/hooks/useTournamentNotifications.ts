import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  tournamentId: string;
  userId: string;
}

export interface TournamentNotifications {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

export const useTournamentNotifications = (tournamentId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(
        `/api/tournaments/${tournamentId}/notifications`
      );
      const rawNotifications = response.data;

      setNotifications(rawNotifications);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch notifications'
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.post(
        `/api/tournaments/${tournamentId}/notifications/${notificationId}/read`
      );
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark notification as read'
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.post(
        `/api/tournaments/${tournamentId}/notifications/read`
      );
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark all notifications as read'
      );
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time updates
    const eventSource = new EventSource(
      `/api/tournaments/${tournamentId}/notifications/stream`
    );

    eventSource.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      setNotifications((prev) => [newNotification, ...prev]);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [tournamentId]);

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    loading,
    error,
    unreadCount: notifications.filter((n) => !n.read).length,
  };
};
