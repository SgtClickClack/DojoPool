type Listener = (state: {
  notifications: any[];
  unreadCount: number;
  preferences: any;
}) => void;

class NotificationServiceStub {
  private _notifications: any[] = [];
  private _unread = 0;
  private _preferences = {
    enabled: true,
    pushNotifications: false,
    emailNotifications: false,
    soundEnabled: false,
    doNotDisturb: { enabled: false, startTime: '22:00', endTime: '07:00' },
  };
  private _listeners = new Set<Listener>();

  getNotifications() {
    return this._notifications;
  }
  getUnreadCount() {
    return this._unread;
  }
  getPreferences() {
    return this._preferences;
  }
  addListener(listener: Listener) {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }
  private _emit() {
    const state = {
      notifications: this._notifications,
      unreadCount: this._unread,
      preferences: this._preferences,
    };
    this._listeners.forEach((l) => l(state));
  }
  async markAllAsRead() {
    this._unread = 0;
    this._notifications = this._notifications.map((n) => ({
      ...n,
      read: true,
    }));
    this._emit();
  }
  async clear() {
    this._notifications = [];
    this._unread = 0;
    this._emit();
  }
  async markAsRead(id: string) {
    this._notifications = this._notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this._unread = Math.max(0, this._unread - 1);
    this._emit();
  }
  async updatePreferences(prefs: any) {
    this._preferences = { ...this._preferences, ...prefs };
    this._emit();
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (
        typeof Notification !== 'undefined' &&
        Notification.requestPermission
      ) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return false;
    } catch {
      return false;
    }
  }
}

const notificationService = new NotificationServiceStub();
export default notificationService;
