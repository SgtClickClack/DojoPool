import { Alert } from "../types/alert";

interface QueuedAction {
  type: "acknowledge" | "dismiss" | "flag";
  alertId: string;
  timestamp: number;
}

export class OfflineStorageService {
  private static instance: OfflineStorageService;
  private readonly ALERTS_KEY = "cached_alerts";
  private readonly ACTIONS_QUEUE_KEY = "queued_actions";
  private readonly MAX_CACHED_ALERTS = 100;

  private constructor() {}

  public static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  public async cacheAlerts(alerts: Alert[]): Promise<void> {
    try {
      const limitedAlerts = alerts.slice(0, this.MAX_CACHED_ALERTS);
      await this.setItem(this.ALERTS_KEY, limitedAlerts);
    } catch (error) {
      console.error("Error caching alerts:", error);
    }
  }

  public async getCachedAlerts(): Promise<Alert[]> {
    try {
      const alerts = await this.getItem<Alert[]>(this.ALERTS_KEY);
      return alerts || [];
    } catch (error) {
      console.error("Error retrieving cached alerts:", error);
      return [];
    }
  }

  public async queueAction(action: QueuedAction): Promise<void> {
    try {
      const queue = await this.getQueuedActions();
      queue.push(action);
      await this.setItem(this.ACTIONS_QUEUE_KEY, queue);
    } catch (error) {
      console.error("Error queuing action:", error);
    }
  }

  public async getQueuedActions(): Promise<QueuedAction[]> {
    try {
      const actions = await this.getItem<QueuedAction[]>(
        this.ACTIONS_QUEUE_KEY,
      );
      return actions || [];
    } catch (error) {
      console.error("Error retrieving queued actions:", error);
      return [];
    }
  }

  public async clearQueuedActions(): Promise<void> {
    try {
      await this.removeItem(this.ACTIONS_QUEUE_KEY);
    } catch (error) {
      console.error("Error clearing queued actions:", error);
    }
  }

  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  }

  private async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      throw error;
    }
  }

  private async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }
}
