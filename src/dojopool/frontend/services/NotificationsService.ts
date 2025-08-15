import api from "./api";
import { NotificationPreferences } from "../../types/user";

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
  priority: "low" | "medium" | "high";
  actions?: NotificationAction[];
}

export type NotificationType =
  | "achievement"
  | "challenge"
  | "training_reminder"
  | "leaderboard_update"
  | "milestone"
  | "system"
  | "social";

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
  filters?: NotificationFilter,
): Promise<Notification[]> {
  const response = await api.get("/notifications", { params: filters });
  return response.data;
}

export async function markAsRead(
  notificationId: string | string[],
): Promise<void> {
  const ids = Array.isArray(notificationId) ? notificationId : [notificationId];
  await api.post("/notifications/mark-read", { ids });
}

export async function markAllAsRead(): Promise<void> {
  await api.post("/notifications/mark-all-read");
}

export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}

export async function clearAllNotifications(): Promise<void> {
  await api.delete("/notifications/clear-all");
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const response = await api.put("/notifications/preferences", preferences);
  return response.data;
}

export async function registerPushEndpoint(
  subscription: PushSubscription,
): Promise<void> {
  await api.post("/notifications/push-endpoint", subscription);
}

export async function unregisterPushEndpoint(): Promise<void> {
  await api.delete("/notifications/push-endpoint");
}

export async function testNotification(): Promise<void> {
  await api.post("/notifications/test");
}

export async function getNotificationCount(): Promise<{
  total: number;
  unread: number;
}> {
  const response = await api.get("/notifications/count");
  return response.data;
}

export async function snoozeNotification(
  notificationId: string,
  duration: number,
): Promise<void> {
  await api.post(`/notifications/${notificationId}/snooze`, { duration });
}

export async function getNotificationSettings(): Promise<{
  preferences: NotificationPreferences;
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
}> {
  const response = await api.get("/notifications/settings");
  return response.data;
}

export async function updateNotificationSettings(settings: {
  preferences?: Partial<NotificationPreferences>;
  channels?: {
    push?: boolean;
    email?: boolean;
    inApp?: boolean;
  };
}): Promise<void> {
  await api.put("/notifications/settings", settings);
}
