import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { API_URL } from "../config";

interface SyncItem {
  id: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  data: any;
  timestamp: number;
}

class SyncManager {
  private static instance: SyncManager;
  private syncQueue: SyncItem[] = [];
  private isSyncing = false;

  private constructor() {
    this.loadQueue();
    this.setupNetworkListener();
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  private async loadQueue() {
    try {
      const queueData = await AsyncStorage.getItem("syncQueue");
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error("Error loading sync queue:", error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.getItem("syncQueue", JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error("Error saving sync queue:", error);
    }
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isSyncing) {
        this.syncPendingItems();
      }
    });
  }

  async addToQueue(item: Omit<SyncItem, "id" | "timestamp">) {
    const syncItem: SyncItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    this.syncQueue.push(syncItem);
    await this.saveQueue();
    this.attemptSync();
  }

  private async attemptSync() {
    const networkState = await NetInfo.fetch();
    if (networkState.isConnected && !this.isSyncing) {
      this.syncPendingItems();
    }
  }

  private async syncPendingItems() {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    const failedItems: SyncItem[] = [];

    for (const item of this.syncQueue) {
      try {
        await fetch(`${API_URL}${item.endpoint}`, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item.data),
        });
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        failedItems.push(item);
      }
    }

    this.syncQueue = failedItems;
    await this.saveQueue();
    this.isSyncing = false;
  }

  getPendingItems(): SyncItem[] {
    return [...this.syncQueue];
  }
}

export default SyncManager;
