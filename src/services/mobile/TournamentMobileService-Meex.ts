import { io, Socket } from 'socket.io-client';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  type: 'tournament' | 'match' | 'social' | 'system' | 'achievement';
  priority: 'low' | 'normal' | 'high';
  read: boolean;
  actionUrl?: string;
}

export interface OfflineData {
  tournaments: any[];
  matches: any[];
  userProfile: any;
  settings: any;
  lastSync: Date;
  pendingActions: OfflineAction[];
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'tournament' | 'match' | 'profile' | 'settings';
  data: any;
  timestamp: Date;
  retryCount: number;
}

export interface MobileConfig {
  enablePushNotifications: boolean;
  enableOfflineMode: boolean;
  syncInterval: number;
  maxOfflineDataAge: number;
  enableBackgroundSync: boolean;
  enableLocationServices: boolean;
  enableBiometricAuth: boolean;
  enableDarkMode: boolean;
  enableHapticFeedback: boolean;
  enableSoundEffects: boolean;
  dataCompression: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  cacheSize: number;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  version: string;
  deviceId: string;
  pushToken?: string;
  capabilities: {
    pushNotifications: boolean;
    offlineStorage: boolean;
    biometricAuth: boolean;
    locationServices: boolean;
    camera: boolean;
    hapticFeedback: boolean;
  };
}

export interface SyncStatus {
  lastSync: Date;
  isOnline: boolean;
  pendingActions: number;
  syncProgress: number;
  error?: string;
}

class TournamentMobileService {
  private socket: Socket | null = null;
  private static instance: TournamentMobileService;
  private config: MobileConfig;
  private deviceInfo: DeviceInfo | null = null;
  private offlineData: OfflineData | null = null;
  private notifications: PushNotification[] = [];
  private _isOnline: boolean = false;
  private _isConnected: boolean = false;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      enablePushNotifications: true,
      enableOfflineMode: true,
      syncInterval: 30000, // 30 seconds
      maxOfflineDataAge: 24 * 60 * 60 * 1000, // 24 hours
      enableBackgroundSync: true,
      enableLocationServices: true,
      enableBiometricAuth: true,
      enableDarkMode: true,
      enableHapticFeedback: true,
      enableSoundEffects: true,
      dataCompression: true,
      imageQuality: 'medium',
      cacheSize: 100 * 1024 * 1024, // 100MB
    };
    this.initializeService();
  }

  public static getInstance(): TournamentMobileService {
    if (!TournamentMobileService.instance) {
      TournamentMobileService.instance = new TournamentMobileService();
    }
    return TournamentMobileService.instance;
  }

  private async initializeService(): Promise<void> {
    await this.detectDevice();
    await this.initializeOfflineStorage();
    this.initializeSocket();
    this.setupSyncInterval();
    this.setupServiceWorker();
  }

  private async detectDevice(): Promise<void> {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = userAgent.includes('iphone') || userAgent.includes('ipad') ? 'ios' :
                    userAgent.includes('android') ? 'android' : 'web';
    
    this.deviceInfo = {
      platform,
      version: navigator.appVersion,
      deviceId: this.generateDeviceId(),
      capabilities: {
        pushNotifications: 'serviceWorker' in navigator && 'PushManager' in window,
        offlineStorage: 'localStorage' in window && 'indexedDB' in window,
        biometricAuth: 'credentials' in navigator,
        locationServices: 'geolocation' in navigator,
        camera: 'mediaDevices' in navigator,
        hapticFeedback: 'vibrate' in navigator,
      }
    };

    console.log('Device detected:', this.deviceInfo);
  }

  private generateDeviceId(): string {
    const storedId = localStorage.getItem('dojopool_device_id');
    if (storedId) return storedId;
    
    const newId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('dojopool_device_id', newId);
    return newId;
  }

  private async initializeOfflineStorage(): Promise<void> {
    if (!this.config.enableOfflineMode) return;

    try {
      const stored = localStorage.getItem('dojopool_offline_data');
      if (stored) {
        this.offlineData = JSON.parse(stored);
        // Check if data is still valid
        if (this.offlineData && Date.now() - new Date(this.offlineData.lastSync).getTime() > this.config.maxOfflineDataAge) {
          this.offlineData = null;
        }
      }

      if (!this.offlineData) {
        this.offlineData = {
          tournaments: [],
          matches: [],
          userProfile: null,
          settings: null,
          lastSync: new Date(),
          pendingActions: [],
        };
      }

      // Load notifications
      const storedNotifications = localStorage.getItem('dojopool_notifications');
      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications);
      }

      console.log('Offline storage initialized');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  private initializeSocket(): void {
    this.socket = io('http://localhost:8080');
    
    this.socket.on('connect', () => {
      console.log('TournamentMobileService connected to server');
      this._isOnline = true;
      this._isConnected = true;
      this.syncData();
    });

    this.socket.on('disconnect', () => {
      console.log('TournamentMobileService disconnected from server');
      this._isOnline = false;
    });

    this.socket.on('push-notification', (notification: PushNotification) => {
      this.handlePushNotification(notification);
    });

    this.socket.on('tournament-update', (data: any) => {
      this.handleTournamentUpdate(data);
    });

    this.socket.on('match-update', (data: any) => {
      this.handleMatchUpdate(data);
    });

    this.socket.on('sync-request', () => {
      this.syncData();
    });
  }

  private setupSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this._isOnline && this.config.enableBackgroundSync) {
        this.syncData();
      }
    }, this.config.syncInterval);
  }

  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator && this.config.enablePushNotifications) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          this.requestNotificationPermission();
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Push notification permission granted');
      }
    }
  }

  // Public Methods
  public getConfig(): MobileConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.setupSyncInterval();
    this.saveConfig();
    this.socket?.emit('mobile-config-updated', this.config);
  }

  public getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  public getSyncStatus(): SyncStatus {
    return {
      lastSync: this.offlineData?.lastSync || new Date(),
      isOnline: this._isOnline,
      pendingActions: this.offlineData?.pendingActions?.length || 0,
      syncProgress: this.syncInProgress ? 50 : 100,
    };
  }

  public getNotifications(): PushNotification[] {
    return [...this.notifications];
  }

  public markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  public clearNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  public async syncData(): Promise<void> {
    if (this.syncInProgress || !this._isOnline) return;

    this.syncInProgress = true;
    console.log('Starting data sync...');

    try {
      // Sync pending actions first
      await this.syncPendingActions();

      // Sync offline data
      if (this.offlineData) {
        const response = await this.socket?.emitWithAck('sync-offline-data', {
          deviceId: this.deviceInfo?.deviceId,
          lastSync: this.offlineData.lastSync,
          data: this.offlineData,
        });

        if (response?.success) {
          this.offlineData = {
            ...response.data,
            lastSync: new Date(),
            pendingActions: this.offlineData.pendingActions,
          };
          this.saveOfflineData();
        }
      }

      console.log('Data sync completed');
    } catch (error) {
      console.error('Data sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncPendingActions(): Promise<void> {
    if (!this.offlineData?.pendingActions.length) return;

    const actions = [...this.offlineData.pendingActions];
    const successfulActions: string[] = [];

    for (const action of actions) {
      try {
        const response = await this.socket?.emitWithAck('execute-offline-action', action);
        if (response?.success) {
          successfulActions.push(action.id);
        } else {
          action.retryCount++;
          if (action.retryCount > 3) {
            // Remove action after 3 failed attempts
            successfulActions.push(action.id);
          }
        }
      } catch (error) {
        console.error('Failed to execute offline action:', action, error);
        action.retryCount++;
      }
    }

    // Remove successful actions
    this.offlineData.pendingActions = this.offlineData.pendingActions.filter(
      action => !successfulActions.includes(action.id)
    );
    this.saveOfflineData();
  }

  public addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): void {
    if (!this.offlineData) return;

    const newAction: OfflineAction = {
      ...action,
      id: 'action_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      retryCount: 0,
    };

    this.offlineData.pendingActions.push(newAction);
    this.saveOfflineData();

    // Try to sync immediately if online
    if (this._isOnline) {
      this.syncData();
    }
  }

  public getOfflineData(): OfflineData | null {
    return this.offlineData;
  }

  public updateOfflineData(updates: Partial<OfflineData>): void {
    if (!this.offlineData) return;

    this.offlineData = { ...this.offlineData, ...updates };
    this.saveOfflineData();
  }

  // Push Notification Methods
  private handlePushNotification(notification: PushNotification): void {
    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.showNotification(notification);
  }

  private showNotification(notification: PushNotification): void {
    if (!this.config.enablePushNotifications) return;

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: '/images/logo.webp',
        badge: '/images/logo.webp',
        tag: notification.id,
        data: notification.data,
      });

      browserNotification.onclick = () => {
        if (notification.actionUrl) {
          window.open(notification.actionUrl, '_blank');
        }
        this.markNotificationAsRead(notification.id);
      };
    }

    // Haptic feedback
    if (this.config.enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }

    // Sound effect
    if (this.config.enableSoundEffects) {
      this.playNotificationSound();
    }
  }

  private playNotificationSound(): void {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore errors if sound file doesn't exist
    });
  }

  // Event Handlers
  private handleTournamentUpdate(data: any): void {
    if (this.offlineData) {
      const index = this.offlineData.tournaments.findIndex(t => t.id === data.id);
      if (index >= 0) {
        this.offlineData.tournaments[index] = { ...this.offlineData.tournaments[index], ...data };
      } else {
        this.offlineData.tournaments.push(data);
      }
      this.saveOfflineData();
    }
  }

  private handleMatchUpdate(data: any): void {
    if (this.offlineData) {
      const index = this.offlineData.matches.findIndex(m => m.id === data.id);
      if (index >= 0) {
        this.offlineData.matches[index] = { ...this.offlineData.matches[index], ...data };
      } else {
        this.offlineData.matches.push(data);
      }
      this.saveOfflineData();
    }
  }

  // Storage Methods
  private saveOfflineData(): void {
    if (this.offlineData) {
      localStorage.setItem('dojopool_offline_data', JSON.stringify(this.offlineData));
    }
  }

  private saveNotifications(): void {
    localStorage.setItem('dojopool_notifications', JSON.stringify(this.notifications));
  }

  private saveConfig(): void {
    localStorage.setItem('dojopool_mobile_config', JSON.stringify(this.config));
  }

  // Utility Methods
  public isOnline(): boolean {
    return this._isOnline;
  }

  public enableOfflineMode(): boolean {
    return this.config.enableOfflineMode;
  }

  public getCacheSize(): number {
    return this.config.cacheSize;
  }

  public clearCache(): void {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('dojopool')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  }

  public disconnect(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.socket?.disconnect();
  }
}

export default TournamentMobileService; 