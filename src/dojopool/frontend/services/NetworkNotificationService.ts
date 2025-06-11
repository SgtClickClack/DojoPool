import { EventEmitter } from "events";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  priority?: "low" | "medium" | "high";
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

class NotificationService extends EventEmitter {
  private notifications: Notification[] = [];
  private preferences: NotificationPreferences = {
    enabled: true,
    pushNotifications: true,
    emailNotifications: true,
    soundEnabled: true,
    doNotDisturb: {
      enabled: false,
      startTime: "22:00",
      endTime: "07:00",
    },
  };

  constructor() {
    super();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedNotifications = localStorage.getItem("notifications");
      const storedPreferences = localStorage.getItem("notificationPreferences");

      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications);
      }

      if (storedPreferences) {
        this.preferences = JSON.parse(storedPreferences);
      }
    } catch (error) {
      console.error("Error loading notifications from storage:", error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem("notifications", JSON.stringify(this.notifications));
      localStorage.setItem(
        "notificationPreferences",
        JSON.stringify(this.preferences),
      );
    } catch (error) {
      console.error("Error saving notifications to storage:", error);
    }
  }

  private emitUpdate() {
    this.emit("update", {
      notifications: this.notifications,
      unreadCount: this.getUnreadCount(),
      preferences: this.preferences,
    });
    this.saveToStorage();
  }

  addNotification(
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    this.emitUpdate();

    if (this.preferences.enabled && !this.isInDoNotDisturbMode()) {
      this.showNotification(newNotification);
    }
  }

  private isInDoNotDisturbMode(): boolean {
    if (!this.preferences.doNotDisturb.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHours, startMinutes] = this.preferences.doNotDisturb.startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = this.preferences.doNotDisturb.endTime
      .split(":")
      .map(Number);

    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private async showNotification(notification: Notification) {
    if (this.preferences.pushNotifications && "Notification" in window) {
      try {
        const permission = await this.requestNotificationPermission();
        if (permission) {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/favicon.ico",
          });
        }
      } catch (error) {
        console.error("Error showing push notification:", error);
      }
    }

    if (this.preferences.soundEnabled) {
      try {
        const audio = new Audio("/notification-sound.mp3");
        await audio.play();
      } catch (error) {
        console.error("Error playing notification sound:", error);
      }
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  async markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.emitUpdate();
    }
  }

  async markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.emitUpdate();
  }

  async clear() {
    this.notifications = [];
    this.emitUpdate();
  }

  async updatePreferences(preferences: NotificationPreferences) {
    this.preferences = preferences;
    this.emitUpdate();
  }

  addListener(
    callback: (state: {
      notifications: Notification[];
      unreadCount: number;
      preferences: NotificationPreferences;
    }) => void,
  ): () => void {
    this.on("update", callback);
    return () => this.off("update", callback);
  }
}

const notificationService = new NotificationService();
export default notificationService;
