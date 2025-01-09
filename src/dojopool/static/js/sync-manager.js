class SyncManager {
    constructor(db) {
        this.db = db;
        this.syncInProgress = false;
        this.setupSync();
    }

    setupSync() {
        // Register sync event listener
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-games');
        });

        // Listen for online/offline events
        window.addEventListener('online', () => this.syncData());
        window.addEventListener('offline', () => this.handleOffline());
    }

    async syncData() {
        if (this.syncInProgress || !navigator.onLine) {
            return;
        }

        this.syncInProgress = true;

        try {
            // Get all unsynced items from different stores
            const unsyncedGames = await this.db.getUnsynced('games');
            const syncQueue = await this.db.getSyncQueue();

            // Sync games
            for (const game of unsyncedGames) {
                await this.syncGame(game);
            }

            // Process sync queue
            for (const item of syncQueue) {
                if (item.status === 'pending') {
                    await this.processSyncItem(item);
                }
            }

            // Notify success
            this.notifySync('success', 'All data synchronized successfully');
        } catch (error) {
            console.error('Sync failed:', error);
            this.notifySync('error', 'Failed to synchronize data');
        } finally {
            this.syncInProgress = false;
        }
    }

    async syncGame(game) {
        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(game)
            });

            if (response.ok) {
                await this.db.markAsSynced('games', game.id);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to sync game:', error);
            return false;
        }
    }

    async processSyncItem(item) {
        try {
            let success = false;

            switch (item.type) {
                case 'game_update':
                    success = await this.handleGameUpdate(item.data);
                    break;
                case 'player_update':
                    success = await this.handlePlayerUpdate(item.data);
                    break;
                case 'venue_update':
                    success = await this.handleVenueUpdate(item.data);
                    break;
                default:
                    console.warn('Unknown sync item type:', item.type);
            }

            if (success) {
                await this.db.updateSyncStatus(item.id, 'completed');
            } else {
                await this.db.updateSyncStatus(item.id, 'failed');
            }
        } catch (error) {
            console.error('Failed to process sync item:', error);
            await this.db.updateSyncStatus(item.id, 'failed');
        }
    }

    async handleGameUpdate(data) {
        try {
            const response = await fetch(`/api/games/${data.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to handle game update:', error);
            return false;
        }
    }

    async handlePlayerUpdate(data) {
        try {
            const response = await fetch(`/api/players/${data.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to handle player update:', error);
            return false;
        }
    }

    async handleVenueUpdate(data) {
        try {
            const response = await fetch(`/api/venues/${data.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to handle venue update:', error);
            return false;
        }
    }

    handleOffline() {
        this.notifySync('warning', 'You are offline. Changes will be synchronized when you are back online.');
    }

    notifySync(type, message) {
        // Dispatch custom event for sync notifications
        const event = new CustomEvent('sync-notification', {
            detail: { type, message }
        });
        window.dispatchEvent(event);
    }

    // Helper method to queue updates for sync
    async queueForSync(type, data) {
        await this.db.addToSyncQueue({
            type,
            data,
            created_at: new Date()
        });

        // Try to sync immediately if online
        if (navigator.onLine) {
            this.syncData();
        }
    }
}
