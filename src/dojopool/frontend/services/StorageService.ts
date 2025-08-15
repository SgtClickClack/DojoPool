import { openDB, IDBPDatabase } from "idb";
import { TrainingSession } from "../../types/training";
import { UserProfile } from "../../types/user";

interface StorageSchema {
  trainingSessions: TrainingSession;
  userProfiles: UserProfile;
  offlineActions: {
    id: string;
    action: string;
    data: any;
    timestamp: string;
    retryCount: number;
  };
  cachedResponses: {
    url: string;
    data: any;
    timestamp: string;
    expiresAt: string;
  };
}

class StorageService {
  private dbName = "dojopool_storage";
  private version = 1;
  private db: IDBPDatabase<StorageSchema> | null = null;

  constructor() {
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    try {
      this.db = await openDB<StorageSchema>(this.dbName, this.version, {
        upgrade(db) {
          // Training sessions store
          if (!db.objectStoreNames.contains("trainingSessions")) {
            db.createObjectStore("trainingSessions", { keyPath: "id" });
          }

          // User profiles store
          if (!db.objectStoreNames.contains("userProfiles")) {
            db.createObjectStore("userProfiles", { keyPath: "id" });
          }

          // Offline actions store
          if (!db.objectStoreNames.contains("offlineActions")) {
            const store = db.createObjectStore("offlineActions", {
              keyPath: "id",
            });
            store.createIndex("timestamp", "timestamp");
            store.createIndex("retryCount", "retryCount");
          }

          // Cache store
          if (!db.objectStoreNames.contains("cachedResponses")) {
            const store = db.createObjectStore("cachedResponses", {
              keyPath: "url",
            });
            store.createIndex("timestamp", "timestamp");
            store.createIndex("expiresAt", "expiresAt");
          }
        },
      });
    } catch (error) {
      console.error("Failed to initialize IndexedDB:", error);
      throw error;
    }
  }

  // Training Sessions
  public async saveTrainingSession(session: TrainingSession): Promise<void> {
    await this.ensureDB();
    await this.db!.put("trainingSessions", session);
  }

  public async getTrainingSession(
    id: string,
  ): Promise<TrainingSession | undefined> {
    await this.ensureDB();
    return this.db!.get("trainingSessions", id);
  }

  public async getAllTrainingSessions(): Promise<TrainingSession[]> {
    await this.ensureDB();
    return this.db!.getAll("trainingSessions");
  }

  // User Profiles
  public async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.ensureDB();
    await this.db!.put("userProfiles", profile);
  }

  public async getUserProfile(id: string): Promise<UserProfile | undefined> {
    await this.ensureDB();
    return this.db!.get("userProfiles", id);
  }

  // Offline Actions
  public async queueOfflineAction(action: string, data: any): Promise<void> {
    await this.ensureDB();
    const offlineAction = {
      id: crypto.randomUUID(),
      action,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    await this.db!.add("offlineActions", offlineAction);
  }

  public async getOfflineActions(): Promise<
    Array<{
      id: string;
      action: string;
      data: any;
      timestamp: string;
      retryCount: number;
    }>
  > {
    await this.ensureDB();
    return this.db!.getAll("offlineActions");
  }

  public async removeOfflineAction(id: string): Promise<void> {
    await this.ensureDB();
    await this.db!.delete("offlineActions", id);
  }

  // Cache Management
  public async cacheResponse(
    url: string,
    data: any,
    ttl: number = 3600000,
  ): Promise<void> {
    await this.ensureDB();
    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ttl).toISOString();

    await this.db!.put("cachedResponses", {
      url,
      data,
      timestamp,
      expiresAt,
    });
  }

  public async getCachedResponse(url: string): Promise<any | null> {
    await this.ensureDB();
    const cached = await this.db!.get("cachedResponses", url);

    if (!cached) {
      return null;
    }

    if (new Date(cached.expiresAt) < new Date()) {
      await this.db!.delete("cachedResponses", url);
      return null;
    }

    return cached.data;
  }

  public async clearExpiredCache(): Promise<void> {
    await this.ensureDB();
    const tx = this.db!.transaction("cachedResponses", "readwrite");
    const store = tx.objectStore("cachedResponses");
    const index = store.index("expiresAt");

    let cursor = await index.openCursor();
    const now = new Date();

    while (cursor) {
      if (new Date(cursor.value.expiresAt) < now) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }
  }

  public async clearAll(): Promise<void> {
    await this.ensureDB();
    const stores = [
      "trainingSessions",
      "userProfiles",
      "offlineActions",
      "cachedResponses",
    ];

    for (const store of stores) {
      await this.db!.clear(store);
    }
  }

  public async getStorageStats(): Promise<{
    trainingSessions: number;
    userProfiles: number;
    offlineActions: number;
    cachedResponses: number;
  }> {
    await this.ensureDB();
    const stats = {
      trainingSessions: 0,
      userProfiles: 0,
      offlineActions: 0,
      cachedResponses: 0,
    };

    for (const store of Object.keys(stats)) {
      stats[store as keyof typeof stats] = await this.db!.count(store);
    }

    return stats;
  }
}

// Create a singleton instance
const storageService = new StorageService();

export default storageService;
