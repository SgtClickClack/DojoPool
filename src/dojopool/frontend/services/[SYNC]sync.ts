import api from './api';
import storageService from './storage';
import analyticsService from './analytics';
import { isNetworkError } from '../utils/errorHandling';

interface SyncStatus {
  lastSync: string;
  pendingActions: number;
  isSyncing: boolean;
  error?: string;
}

interface SyncConfig {
  autoSyncInterval: number;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
}

class SyncService {
  private status: SyncStatus = {
    lastSync: '',
    pendingActions: 0,
    isSyncing: false,
  };

  private config: SyncConfig = {
    autoSyncInterval: 300000, // 5 minutes
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 50,
  };

  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAutoSync();
    this.registerNetworkListeners();
  }

  private initializeAutoSync(): void {
    if (typeof window !== 'undefined') {
      this.syncInterval = setInterval(() => {
        this.sync();
      }, this.config.autoSyncInterval);
    }
  }

  private registerNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private async handleOnline(): Promise<void> {
    console.log('Network connection restored. Starting sync...');
    await this.sync();
  }

  private handleOffline(): void {
    console.log('Network connection lost. Pausing sync...');
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  public async sync(): Promise<void> {
    if (this.status.isSyncing || !navigator.onLine) {
      return;
    }

    this.status.isSyncing = true;
    this.updateStatus();

    try {
      // Get all pending offline actions
      const actions = await storageService.getOfflineActions();
      this.status.pendingActions = actions.length;
      this.updateStatus();

      // Process actions in batches
      for (let i = 0; i < actions.length; i += this.config.batchSize) {
        const batch = actions.slice(i, i + this.config.batchSize);
        await this.processBatch(batch);
      }

      // Sync user profile
      await this.syncUserProfile();

      // Sync training sessions
      await this.syncTrainingSessions();

      // Update last sync timestamp
      this.status.lastSync = new Date().toISOString();
      this.status.pendingActions = 0;
      this.status.error = undefined;
    } catch (error) {
      console.error('Sync failed:', error);
      this.status.error = error instanceof Error ? error.message : 'Sync failed';

      // Track sync failure
      analyticsService.trackUserEvent({
        type: 'sync_failure',
        userId: 'system',
        details: { error: this.status.error },
      });
    } finally {
      this.status.isSyncing = false;
      this.updateStatus();
    }
  }

  private async processBatch(
    actions: Array<{
      id: string;
      action: string;
      data: any;
      timestamp: string;
      retryCount: number;
    }>
  ): Promise<void> {
    for (const action of actions) {
      try {
        await this.processAction(action);
        await storageService.removeOfflineAction(action.id);
      } catch (error) {
        if (action.retryCount < this.config.maxRetries && !isNetworkError(error)) {
          // Queue for retry with increased retry count
          await storageService.queueOfflineAction(action.action, {
            ...action.data,
            retryCount: action.retryCount + 1,
          });
        }
        throw error;
      }
    }
  }

  private async processAction(action: { action: string; data: any }): Promise<void> {
    switch (action.action) {
      case 'update_training':
        await api.put(`/training/session/${action.data.id}`, action.data);
        break;
      case 'submit_feedback':
        await api.post(`/training/feedback`, action.data);
        break;
      case 'update_profile':
        await api.put('/user/profile', action.data);
        break;
      default:
        console.warn('Unknown action type:', action.action);
    }
  }

  private async syncUserProfile(): Promise<void> {
    const localProfiles = await storageService.getAllUserProfiles();

    for (const profile of localProfiles) {
      try {
        const serverProfile = await api.get(`/user/profile/${profile.id}`);

        if (new Date(serverProfile.data.lastModified) > new Date(profile.lastModified)) {
          await storageService.saveUserProfile(serverProfile.data);
        }
      } catch (error) {
        console.error('Failed to sync user profile:', error);
      }
    }
  }

  private async syncTrainingSessions(): Promise<void> {
    const localSessions = await storageService.getAllTrainingSessions();

    for (const session of localSessions) {
      try {
        const serverSession = await api.get(`/training/session/${session.id}`);

        if (new Date(serverSession.data.lastModified) > new Date(session.lastModified)) {
          await storageService.saveTrainingSession(serverSession.data);
        }
      } catch (error) {
        console.error('Failed to sync training session:', error);
      }
    }
  }

  private updateStatus(): void {
    // Emit status update event
    const event = new CustomEvent('sync:status', { detail: this.status });
    window.dispatchEvent(event);
  }

  public getStatus(): SyncStatus {
    return { ...this.status };
  }

  public updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reset auto-sync interval if it was changed
    if (newConfig.autoSyncInterval && this.syncInterval) {
      clearInterval(this.syncInterval);
      this.initializeAutoSync();
    }
  }

  public async forceSyncNow(): Promise<void> {
    await this.sync();
  }
}

// Create a singleton instance
const syncService = new SyncService();

export default syncService;
