export interface MobileNotification {
  id: string;
  type: 'tournament_start' | 'match_update' | 'bracket_progress' | 'stream_start' | 'achievement' | 'reminder';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface OfflineData {
  tournaments: any[];
  matches: any[];
  userProfile: any;
  cachedAt: Date;
  version: string;
}

export interface MobileSettings {
  pushNotifications: {
    tournamentUpdates: boolean;
    matchResults: boolean;
    streamAlerts: boolean;
    achievements: boolean;
    reminders: boolean;
  };
  offlineMode: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
  };
  performance: {
    lowDataMode: boolean;
    imageQuality: 'low' | 'medium' | 'high';
    autoPlayVideos: boolean;
  };
}

export interface SyncStatus {
  lastSync: Date;
  pendingChanges: number;
  syncInProgress: boolean;
  error?: string;
}

class TournamentMobileService {
  private notifications: MobileNotification[] = [];
  private offlineData: OfflineData | null = null;
  private settings: MobileSettings;
  private syncStatus: SyncStatus;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.settings = this.loadSettings();
    this.syncStatus = {
      lastSync: new Date(),
      pendingChanges: 0,
      syncInProgress: false,
    };
    this.initializeService();
  }

  private initializeService(): void {
    // Load cached data
    this.loadOfflineData();
    
    // Setup online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatus();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOfflineStatus();
    });

    // Setup periodic sync
    if (this.settings.offlineMode.autoSync) {
      setInterval(() => {
        this.syncData();
      }, this.settings.offlineMode.syncInterval * 60 * 1000);
    }
  }

  // Push Notifications
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async sendLocalNotification(notification: Omit<MobileNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    const fullNotification: MobileNotification = {
      ...notification,
      id: `notification_${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(fullNotification);
    this.saveNotifications();

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/badge.png',
        data: notification.data,
      });
    }

    this.publish('notification_received', fullNotification);
  }

  // Offline Capabilities
  async cacheTournamentData(tournaments: any[], matches: any[]): Promise<void> {
    this.offlineData = {
      tournaments,
      matches,
      userProfile: await this.getUserProfile(),
      cachedAt: new Date(),
      version: '1.0.0',
    };

    this.saveOfflineData();
  }

  async getOfflineTournaments(): Promise<any[]> {
    if (!this.offlineData) {
      await this.loadOfflineData();
    }
    return this.offlineData?.tournaments || [];
  }

  async getOfflineMatches(): Promise<any[]> {
    if (!this.offlineData) {
      await this.loadOfflineData();
    }
    return this.offlineData?.matches || [];
  }

  async syncData(): Promise<void> {
    if (!this.isOnline) {
      this.syncStatus.syncInProgress = false;
      this.syncStatus.error = 'No internet connection';
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.publish('sync_status_changed', this.syncStatus);

    try {
      // Simulate sync
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
      
      this.syncStatus.lastSync = new Date();
      this.syncStatus.pendingChanges = 0;
      this.syncStatus.error = undefined;
    } catch (error) {
      this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
    } finally {
      this.syncStatus.syncInProgress = false;
      this.publish('sync_status_changed', this.syncStatus);
    }
  }

  // Mobile-specific Features
  async getTournamentForMobile(tournamentId: string): Promise<any | null> {
    if (this.isOnline) {
      try {
        const response = await fetch(`/api/v1/tournaments/${tournamentId}`);
        if (response.ok) {
          const tournament = await response.json();
          return tournament;
        }
      } catch (error) {
        console.error('Error fetching tournament:', error);
      }
    }

    // Fallback to offline data
    const offlineTournaments = await this.getOfflineTournaments();
    return offlineTournaments.find(t => t.id === tournamentId) || null;
  }

  async getMatchForMobile(matchId: string): Promise<any | null> {
    if (this.isOnline) {
      try {
        const response = await fetch(`/api/v1/matches/${matchId}`);
        if (response.ok) {
          const match = await response.json();
          return match;
        }
      } catch (error) {
        console.error('Error fetching match:', error);
      }
    }

    // Fallback to offline data
    const offlineMatches = await this.getOfflineMatches();
    return offlineMatches.find(m => m.id === matchId) || null;
  }

  // Settings Management
  updateSettings(newSettings: Partial<MobileSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.publish('settings_updated', this.settings);
  }

  getSettings(): MobileSettings {
    return { ...this.settings };
  }

  // Notifications Management
  getNotifications(): MobileNotification[] {
    return [...this.notifications];
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.publish('notification_updated', notification);
    }
  }

  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
    this.publish('notifications_cleared', null);
  }

  // Subscription System
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event)!.add(callback);

    return () => {
      const subscribers = this.subscribers.get(event);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  private async handleOnlineStatus(): Promise<void> {
    this.publish('online_status_changed', { isOnline: true });
    
    // Sync data when coming back online
    if (this.settings.offlineMode.autoSync) {
      await this.syncData();
    }
  }

  private handleOfflineStatus(): void {
    this.publish('online_status_changed', { isOnline: false });
  }

  private async getUserProfile(): Promise<any> {
    try {
      const response = await fetch('/api/v1/profile');
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  }

  private loadSettings(): MobileSettings {
    try {
      const saved = localStorage.getItem('tournament_mobile_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading mobile settings:', error);
    }

    return {
      pushNotifications: {
        tournamentUpdates: true,
        matchResults: true,
        streamAlerts: true,
        achievements: true,
        reminders: true,
      },
      offlineMode: {
        enabled: true,
        autoSync: true,
        syncInterval: 30, // 30 minutes
      },
      performance: {
        lowDataMode: false,
        imageQuality: 'medium',
        autoPlayVideos: false,
      },
    };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('tournament_mobile_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving mobile settings:', error);
    }
  }

  private loadOfflineData(): void {
    try {
      const saved = localStorage.getItem('tournament_offline_data');
      if (saved) {
        this.offlineData = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }

  private saveOfflineData(): void {
    try {
      localStorage.setItem('tournament_offline_data', JSON.stringify(this.offlineData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem('tournament_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private loadNotifications(): void {
    try {
      const saved = localStorage.getItem('tournament_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  private publish(event: string, data: any): void {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in mobile service subscriber callback:', error);
        }
      });
    }
  }

  // Public API
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const tournamentMobileService = new TournamentMobileService();
export default tournamentMobileService; 