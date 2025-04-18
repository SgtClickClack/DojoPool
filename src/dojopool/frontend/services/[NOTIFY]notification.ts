import stateService from "./state";
import analyticsService from "./analytics";
import storageService from "./storage";
import websocketService from "./websocket";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category?: string;
  priority?: "low" | "medium" | "high";
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  userId: string;
}

interface NotificationPreferences {
  enabled: boolean;
  categories: {
    [category: string]: boolean;
  };
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isInitialized: boolean;
}

class NotificationService {
  private state: NotificationState = {
    notifications: [],
    unreadCount: 0,
    preferences: {
      enabled: true,
      categories: {},
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      doNotDisturb: {
        enabled: false,
        startTime: "22:00",
        endTime: "07:00",
      },
    },
    isInitialized: false,
  };
  private listeners: Set<(state: NotificationState) => void> = new Set();
  private readonly STORAGE_KEY = "app:notifications";
  private readonly MAX_NOTIFICATIONS = 100;

  constructor() {
    this.initialize();
    this.setupWebSocket();
  }

  private async initialize(): void {
    try {
      // Load saved notifications and preferences
      await this.loadFromStorage();

      // Setup cleanup interval
      this.setupCleanupInterval();

      // Mark as initialized
      this.state.isInitialized = true;
      this.notifyListeners();

      // Track initialization
      analyticsService.trackUserEvent({
        type: "notification_service_initialized",
        userId: "system",
        details: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const saved = await storageService.getItem(this.STORAGE_KEY);
      if (saved) {
        const { notifications, preferences } = JSON.parse(saved);
        this.state.notifications = notifications || [];
        this.state.preferences = {
          ...this.state.preferences,
          ...preferences,
        };
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error("Failed to load notifications from storage:", error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await storageService.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          notifications: this.state.notifications,
          preferences: this.state.preferences,
        }),
      );
    } catch (error) {
      console.error("Failed to save notifications to storage:", error);
    }
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Run cleanup every minute
  }

  private cleanup(): void {
    const now = new Date().toISOString();
    const expired = this.state.notifications.filter(
      (notification) => notification.expiresAt && notification.expiresAt < now,
    );

    if (expired.length > 0) {
      this.state.notifications = this.state.notifications.filter(
        (notification) =>
          !notification.expiresAt || notification.expiresAt >= now,
      );
      this.updateUnreadCount();
      this.saveToStorage();
      this.notifyListeners();

      // Track cleanup
      analyticsService.trackUserEvent({
        type: "notifications_cleaned_up",
        userId: "system",
        details: {
          expiredCount: expired.length,
          timestamp: now,
        },
      });
    }

    // Enforce max notifications limit
    if (this.state.notifications.length > this.MAX_NOTIFICATIONS) {
      const excess = this.state.notifications.length - this.MAX_NOTIFICATIONS;
      this.state.notifications = this.state.notifications
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, this.MAX_NOTIFICATIONS);
      this.updateUnreadCount();
      this.saveToStorage();
      this.notifyListeners();

      // Track limit enforcement
      analyticsService.trackUserEvent({
        type: "notifications_limit_enforced",
        userId: "system",
        details: {
          removedCount: excess,
          timestamp: now,
        },
      });
    }
  }

  private updateUnreadCount(): void {
    this.state.unreadCount = this.state.notifications.filter(
      (n) => !n.read,
    ).length;
  }

  public async add(
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ): Promise<string> {
    // Check if notifications are enabled
    if (!this.state.preferences.enabled) {
      return "";
    }

    // Check category preferences
    if (
      notification.category &&
      !this.state.preferences.categories[notification.category]
    ) {
      return "";
    }

    // Check do not disturb
    if (this.isInDoNotDisturbPeriod()) {
      return "";
    }

    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.state.notifications.unshift(newNotification);
    this.updateUnreadCount();
    await this.saveToStorage();
    this.notifyListeners();

    // Track notification added
    analyticsService.trackUserEvent({
      type: "notification_added",
      userId: notification.userId,
      details: {
        notificationId: id,
        type: notification.type,
        category: notification.category,
        timestamp: newNotification.timestamp,
      },
    });

    return id;
  }

  public async markAsRead(id: string): Promise<void> {
    const notification = this.state.notifications.find((n) => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.updateUnreadCount();
      await this.saveToStorage();
      this.notifyListeners();

      // Track notification read
      analyticsService.trackUserEvent({
        type: "notification_read",
        userId: notification.userId,
        details: {
          notificationId: id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  public async markAllAsRead(): Promise<void> {
    const unreadCount = this.state.unreadCount;
    if (unreadCount > 0) {
      this.state.notifications.forEach((n) => (n.read = true));
      this.updateUnreadCount();
      await this.saveToStorage();
      this.notifyListeners();

      // Track all notifications read
      analyticsService.trackUserEvent({
        type: "all_notifications_read",
        userId: "system",
        details: {
          count: unreadCount,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  public async remove(id: string): Promise<void> {
    const index = this.state.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      const [notification] = this.state.notifications.splice(index, 1);
      this.updateUnreadCount();
      await this.saveToStorage();
      this.notifyListeners();

      // Track notification removed
      analyticsService.trackUserEvent({
        type: "notification_removed",
        userId: notification.userId,
        details: {
          notificationId: id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  public async clear(): Promise<void> {
    const count = this.state.notifications.length;
    if (count > 0) {
      this.state.notifications = [];
      this.updateUnreadCount();
      await this.saveToStorage();
      this.notifyListeners();

      // Track notifications cleared
      analyticsService.trackUserEvent({
        type: "notifications_cleared",
        userId: "system",
        details: {
          count,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  public getNotifications(): Notification[] {
    return [...this.state.notifications];
  }

  public getUnreadCount(): number {
    return this.state.unreadCount;
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.state.preferences };
  }

  public async updatePreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<void> {
    this.state.preferences = {
      ...this.state.preferences,
      ...preferences,
    };
    await this.saveToStorage();
    this.notifyListeners();

    // Track preferences update
    analyticsService.trackUserEvent({
      type: "notification_preferences_updated",
      userId: "system",
      details: {
        preferences,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private isInDoNotDisturbPeriod(): boolean {
    if (!this.state.preferences.doNotDisturb.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
    const { startTime, endTime } = this.state.preferences.doNotDisturb;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Handle overnight periods (e.g., 22:00 to 07:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  public isInitialized(): boolean {
    return this.state.isInitialized;
  }

  public addListener(listener: (state: NotificationState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private setupWebSocket(): void {
    websocketService.subscribe("notifications", (data) => {
      switch (data.type) {
        case "new_notification":
          this.handleNewNotification(data.notification);
          break;
        case "notification_update":
          this.handleNotificationUpdate(data.notification);
          break;
        case "notification_delete":
          this.handleNotificationDelete(data.notificationId);
          break;
      }
    });
  }

  private handleNewNotification(notification: Notification): void {
    // Add the new notification
    this.state.notifications.unshift(notification);

    // Update unread count
    if (!notification.read) {
      this.state.unreadCount++;
    }

    // Trim notifications if exceeding max limit
    if (this.state.notifications.length > this.MAX_NOTIFICATIONS) {
      this.state.notifications = this.state.notifications.slice(
        0,
        this.MAX_NOTIFICATIONS,
      );
    }

    // Save and notify
    this.saveToStorage();
    this.notifyListeners();

    // Show browser notification if enabled
    this.showBrowserNotification(notification);
  }

  private handleNotificationUpdate(notification: Notification): void {
    const index = this.state.notifications.findIndex(
      (n) => n.id === notification.id,
    );
    if (index !== -1) {
      const wasUnread = !this.state.notifications[index].read;
      const isNowRead = notification.read;

      this.state.notifications[index] = notification;

      // Update unread count if read status changed
      if (wasUnread && isNowRead) {
        this.state.unreadCount = Math.max(0, this.state.unreadCount - 1);
      } else if (!wasUnread && !isNowRead) {
        this.state.unreadCount++;
      }

      this.saveToStorage();
      this.notifyListeners();
    }
  }

  private handleNotificationDelete(notificationId: string): void {
    const index = this.state.notifications.findIndex(
      (n) => n.id === notificationId,
    );
    if (index !== -1) {
      const wasUnread = !this.state.notifications[index].read;
      this.state.notifications.splice(index, 1);

      if (wasUnread) {
        this.state.unreadCount = Math.max(0, this.state.unreadCount - 1);
      }

      this.saveToStorage();
      this.notifyListeners();
    }
  }

  private async showBrowserNotification(
    notification: Notification,
  ): Promise<void> {
    if (
      this.state.preferences.enabled &&
      this.state.preferences.pushNotifications &&
      !this.isInDoNotDisturbPeriod() &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: "/logo192.png",
          tag: notification.id,
          silent: !this.state.preferences.soundEnabled,
        });

        browserNotification.onclick = () => {
          window.focus();
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
          this.markAsRead(notification.id);
        };

        // Track notification display
        analyticsService.trackUserEvent({
          type: "notification_displayed",
          userId: notification.userId,
          details: {
            notificationId: notification.id,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error("Failed to show browser notification:", error);
      }
    }
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }
}

export default new NotificationService();
