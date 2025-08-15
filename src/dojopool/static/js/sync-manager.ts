// Type definitions
interface DB {
  getUnsynced(store: string): Promise<any[]>;
  getSyncQueue(): Promise<SyncQueueItem[]>;
  markAsSynced(store: string, id: string): Promise<void>;
  updateSyncStatus(id: string, status: SyncStatus): Promise<void>;
  addToSyncQueue(item: Omit<SyncQueueItem, "id" | "status">): Promise<void>;
}

interface SyncQueueItem {
  id: string;
  type: "game_update" | "player_update" | "venue_update";
  data: any;
  status: SyncStatus;
  created_at: Date;
}

type SyncStatus = "pending" | "completed" | "failed";
type NotificationType = "success" | "warning" | "error";

// Remove duplicate class declaration and keep only one
class SyncManager {
  private db: DB;
  private syncInProgress: boolean;

  constructor(db: DB) {
    this.db = db;
    this.syncInProgress = false;
    this.setupSync();
  }

  setupSync(): void {
    // Register sync event listener
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register("sync-games");
    });

    // Listen for online/offline events
    window.addEventListener("online", () => this.syncData());
    window.addEventListener("offline", () => this.handleOffline());
  }

  async syncData(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Get all unsynced items from different stores
      const unsyncedGames = await this.db.getUnsynced("games");
      const syncQueue = await this.db.getSyncQueue();

      // Sync games
      for (const game of unsyncedGames) {
        await this.syncGame(game);
      }

      // Process sync queue
      for (const item of syncQueue) {
        if (item.status === "pending") {
          await this.processSyncItem(item);
        }
      }

      // Notify success
      this.notifySync("success", "All data synchronized successfully");
    } catch (error) {
      console.error("Sync failed:", error);
      this.notifySync("error", "Failed to synchronize data");
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncGame(game: any): Promise<boolean> {
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(game),
      });

      if (response.ok) {
        await this.db.markAsSynced("games", game.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to sync game:", error);
      return false;
    }
  }

  async processSyncItem(item: SyncQueueItem): Promise<void> {
    try {
      let success = false;

      switch (item.type) {
        case "game_update":
          success = await this.handleGameUpdate(item.data);
          break;
        case "player_update":
          success = await this.handlePlayerUpdate(item.data);
          break;
        case "venue_update":
          success = await this.handleVenueUpdate(item.data);
          break;
        default:
          console.warn("Unknown sync item type:", item.type);
      }

      if (success) {
        await this.db.updateSyncStatus(item.id, "completed");
      } else {
        await this.db.updateSyncStatus(item.id, "failed");
      }
    } catch (error) {
      console.error("Failed to process sync item:", error);
      await this.db.updateSyncStatus(item.id, "failed");
    }
  }

  async handleGameUpdate(data: any): Promise<boolean> {
    try {
      const response = await fetch(`/api/games/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to handle game update:", error);
      return false;
    }
  }

  async handlePlayerUpdate(data: any): Promise<boolean> {
    try {
      const response = await fetch(`/api/players/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to handle player update:", error);
      return false;
    }
  }

  async handleVenueUpdate(data: any): Promise<boolean> {
    try {
      const response = await fetch(`/api/venues/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to handle venue update:", error);
      return false;
    }
  }

  handleOffline(): void {
    this.notifySync(
      "warning",
      "You are offline. Changes will be synchronized when you are back online.",
    );
  }

  notifySync(type: NotificationType, message: string): void {
    // Dispatch custom event for sync notifications
    const event = new CustomEvent("sync-notification", {
      detail: { type, message },
    });
    window.dispatchEvent(event);
  }

  // Helper method to queue updates for sync
  async queueForSync(type: SyncQueueItem["type"], data: any): Promise<void> {
    await this.db.addToSyncQueue({
      type,
      data,
      created_at: new Date(),
    });

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncData();
    }
  }
}

export default SyncManager;
