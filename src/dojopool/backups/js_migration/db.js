class DojoPoolDB {
  constructor() {
    this.dbName = "dojo_pool_db";
    this.dbVersion = 1;
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Games store
        if (!db.objectStoreNames.contains("games")) {
          const gamesStore = db.createObjectStore("games", {
            keyPath: "id",
            autoIncrement: true,
          });
          gamesStore.createIndex("venue_id", "venue_id");
          gamesStore.createIndex("status", "status");
          gamesStore.createIndex("created_at", "created_at");
        }

        // Players store
        if (!db.objectStoreNames.contains("players")) {
          const playersStore = db.createObjectStore("players", {
            keyPath: "id",
          });
          playersStore.createIndex("email", "email", { unique: true });
          playersStore.createIndex("username", "username");
        }

        // Venues store
        if (!db.objectStoreNames.contains("venues")) {
          const venuesStore = db.createObjectStore("venues", { keyPath: "id" });
          venuesStore.createIndex("location", "location");
          venuesStore.createIndex("name", "name");
        }

        // Sync queue store
        if (!db.objectStoreNames.contains("sync_queue")) {
          const syncStore = db.createObjectStore("sync_queue", {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("type", "type");
          syncStore.createIndex("status", "status");
        }
      };
    });
  }

  async addGame(game) {
    return this.addItem("games", {
      ...game,
      created_at: new Date(),
      synced: false,
    });
  }

  async getGame(id) {
    return this.getItem("games", id);
  }

  async updateGame(id, updates) {
    return this.updateItem("games", id, updates);
  }

  async deleteGame(id) {
    return this.deleteItem("games", id);
  }

  async addToSyncQueue(item) {
    return this.addItem("sync_queue", {
      ...item,
      status: "pending",
      created_at: new Date(),
    });
  }

  async getSyncQueue() {
    return this.getAllItems("sync_queue");
  }

  async updateSyncStatus(id, status) {
    return this.updateItem("sync_queue", id, { status });
  }

  // Generic CRUD operations
  async addItem(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getItem(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllItems(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateItem(storeName, id, updates) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = { ...request.result, ...updates };
        const updateRequest = store.put(item);
        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = () => reject(updateRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Query helpers
  async queryByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync helpers
  async markAsSynced(storeName, id) {
    return this.updateItem(storeName, id, {
      synced: true,
      synced_at: new Date(),
    });
  }

  async getUnsynced(storeName) {
    return this.queryByIndex(storeName, "synced", false);
  }
}
