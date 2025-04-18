import { create } from "zustand";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  timestamp: number;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">,
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotifications = create<NotificationStore>((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(7);
    const timestamp = Date.now();

    set((state) => ({
      notifications: [
        { ...notification, id, timestamp },
        ...state.notifications,
      ].slice(0, 5), // Keep only the last 5 notifications
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

// Utility functions for common notifications
export const showError = (message: string, title?: string) => {
  useNotifications.getState().addNotification({
    type: "error",
    message,
    title,
  });
};

export const showSuccess = (message: string, title?: string) => {
  useNotifications.getState().addNotification({
    type: "success",
    message,
    title,
  });
};

export const showWarning = (message: string, title?: string) => {
  useNotifications.getState().addNotification({
    type: "warning",
    message,
    title,
  });
};

export const showInfo = (message: string, title?: string) => {
  useNotifications.getState().addNotification({
    type: "info",
    message,
    title,
  });
};
