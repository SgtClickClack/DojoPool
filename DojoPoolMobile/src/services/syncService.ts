import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { appApi } from './api';
import { Game, Venue, User } from '../types/api';

export interface SyncQueueItem {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'GAME' | 'VENUE' | 'USER' | 'PROFILE';
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingItems: number;
  syncInProgress: boolean;
  error: string | null;
}

export interface OfflineData {
  games: Game[];
  venues: Venue[];
  user: User | null;
  lastUpdated: number;
}

class SyncService {
  private syncQueue: SyncQueueItem[] = [];
  private syncStatus: SyncStatus = {
    isOnline: true,
    lastSync: Date.now(),
    pendingItems: 0,
    syncInProgress: false,
    error: null,
  };
  private listeners: ((status: SyncStatus) => void)[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSync();
  }

  private async initializeSync() {
    await this.loadSyncQueue();
    await this.loadSyncStatus();
    this.setupNetworkListener();
    this.startPeriodicSync();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOnline = this.syncStatus.isOnline;
      this.syncStatus.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.syncStatus.isOnline) {
        this.processSyncQueue();
      }

      this.notifyListeners();
    });
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 30000); // Sync every 30 seconds when online
  }

  // Add item to sync queue
  async addToSyncQueue(
    item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>
  ) {
    const syncItem: SyncQueueItem = {
      ...item,
      id: `${item.type}_${item.entity}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(syncItem);
    this.syncStatus.pendingItems = this.syncQueue.length;
    await this.saveSyncQueue();
    this.notifyListeners();

    if (this.syncStatus.isOnline) {
      this.processSyncQueue();
    }
  }

  // Process sync queue
  private async processSyncQueue() {
    if (this.syncStatus.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.notifyListeners();

    try {
      const itemsToProcess = [...this.syncQueue];

      for (const item of itemsToProcess) {
        try {
          await this.processSyncItem(item);
          this.removeFromQueue(item.id);
        } catch (error) {
          item.retryCount++;
          if (item.retryCount >= 3) {
            this.syncStatus.error = `Failed to sync ${item.entity} after 3 attempts`;
            this.removeFromQueue(item.id);
          }
        }
      }

      this.syncStatus.lastSync = Date.now();
      this.syncStatus.error = null;
    } catch (error) {
      this.syncStatus.error =
        error instanceof Error ? error.message : 'Sync failed';
    } finally {
      this.syncStatus.syncInProgress = false;
      this.syncStatus.pendingItems = this.syncQueue.length;
      await this.saveSyncStatus();
      this.notifyListeners();
    }
  }

  private async processSyncItem(item: SyncQueueItem) {
    switch (item.entity) {
      case 'GAME':
        await this.syncGame(item);
        break;
      case 'VENUE':
        await this.syncVenue(item);
        break;
      case 'USER':
        await this.syncUser(item);
        break;
      case 'PROFILE':
        await this.syncProfile(item);
        break;
    }
  }

  private async syncGame(item: SyncQueueItem) {
    switch (item.type) {
      case 'CREATE':
        await appApi.createGame(item.data);
        break;
      case 'UPDATE':
        await appApi.updateGameStatus(item.data.id, item.data.status);
        break;
      case 'DELETE':
        // Handle game deletion if needed
        break;
    }
  }

  private async syncVenue(item: SyncQueueItem) {
    // Handle venue sync operations
  }

  private async syncUser(item: SyncQueueItem) {
    // Handle user sync operations
  }

  private async syncProfile(item: SyncQueueItem) {
    await appApi.updateProfile(item.data);
  }

  private removeFromQueue(id: string) {
    this.syncQueue = this.syncQueue.filter((item) => item.id !== id);
  }

  // Offline data management
  async saveOfflineData(data: Partial<OfflineData>) {
    const existing = await this.getOfflineData();
    const updated = { ...existing, ...data, lastUpdated: Date.now() };
    await AsyncStorage.setItem('offlineData', JSON.stringify(updated));
  }

  async getOfflineData(): Promise<OfflineData> {
    const data = await AsyncStorage.getItem('offlineData');
    return data
      ? JSON.parse(data)
      : {
          games: [],
          venues: [],
          user: null,
          lastUpdated: 0,
        };
  }

  // Sync status management
  async getSyncStatus(): Promise<SyncStatus> {
    return this.syncStatus;
  }

  addStatusListener(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.syncStatus));
  }

  // Manual sync trigger
  async forceSync() {
    if (this.syncStatus.isOnline) {
      await this.processSyncQueue();
    }
  }

  // Clear sync queue
  async clearSyncQueue() {
    this.syncQueue = [];
    this.syncStatus.pendingItems = 0;
    await this.saveSyncQueue();
    this.notifyListeners();
  }

  // Persistence methods
  private async saveSyncQueue() {
    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  private async loadSyncQueue() {
    const data = await AsyncStorage.getItem('syncQueue');
    this.syncQueue = data ? JSON.parse(data) : [];
    this.syncStatus.pendingItems = this.syncQueue.length;
  }

  private async saveSyncStatus() {
    await AsyncStorage.setItem('syncStatus', JSON.stringify(this.syncStatus));
  }

  private async loadSyncStatus() {
    const data = await AsyncStorage.getItem('syncStatus');
    if (data) {
      this.syncStatus = { ...this.syncStatus, ...JSON.parse(data) };
    }
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const syncService = new SyncService();
export default syncService;
