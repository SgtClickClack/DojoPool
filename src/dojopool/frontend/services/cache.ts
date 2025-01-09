import analyticsService from './analytics';

interface CacheConfig {
    name: string;
    version: number;
    maxAge?: number;
    maxItems?: number;
    persistToStorage?: boolean;
}

interface CacheEntry<T = any> {
    key: string;
    value: T;
    timestamp: number;
    expiry?: number;
    tags?: string[];
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    oldestEntry: number;
    newestEntry: number;
}

class CacheService {
    private caches: Map<string, Map<string, CacheEntry>> = new Map();
    private configs: Map<string, CacheConfig> = new Map();
    private stats: Map<string, CacheStats> = new Map();

    constructor() {
        this.initializeFromStorage();
        this.setupCleanupInterval();
    }

    private async initializeFromStorage(): Promise<void> {
        try {
            const storedCaches = localStorage.getItem('app:caches');
            if (storedCaches) {
                const parsed = JSON.parse(storedCaches);
                Object.entries(parsed).forEach(([name, config]) => {
                    this.createCache(config as CacheConfig);
                    const storedData = localStorage.getItem(`app:cache:${name}`);
                    if (storedData) {
                        const entries = JSON.parse(storedData) as CacheEntry[];
                        const cache = this.caches.get(name)!;
                        entries.forEach(entry => cache.set(entry.key, entry));
                    }
                });
            }
        } catch (error) {
            console.error('Failed to initialize caches from storage:', error);
            // Clear potentially corrupted data
            localStorage.removeItem('app:caches');
        }
    }

    private setupCleanupInterval(): void {
        setInterval(() => {
            this.cleanup();
        }, 60000); // Run cleanup every minute
    }

    public createCache(config: CacheConfig): void {
        if (this.caches.has(config.name)) {
            throw new Error(`Cache ${config.name} already exists`);
        }

        this.caches.set(config.name, new Map());
        this.configs.set(config.name, config);
        this.stats.set(config.name, {
            hits: 0,
            misses: 0,
            size: 0,
            oldestEntry: Date.now(),
            newestEntry: Date.now()
        });

        if (config.persistToStorage) {
            const caches = Object.fromEntries(this.configs.entries());
            localStorage.setItem('app:caches', JSON.stringify(caches));
        }

        // Track cache creation in analytics
        analyticsService.trackUserEvent({
            type: 'cache_created',
            userId: 'system',
            details: {
                cacheName: config.name,
                timestamp: new Date().toISOString()
            }
        });
    }

    public set<T>(cacheName: string, key: string, value: T, options: {
        maxAge?: number;
        tags?: string[];
    } = {}): void {
        const cache = this.caches.get(cacheName);
        const config = this.configs.get(cacheName);
        if (!cache || !config) {
            throw new Error(`Cache ${cacheName} not found`);
        }

        const entry: CacheEntry<T> = {
            key,
            value,
            timestamp: Date.now(),
            expiry: options.maxAge ? Date.now() + options.maxAge : undefined,
            tags: options.tags
        };

        cache.set(key, entry);

        // Update stats
        const stats = this.stats.get(cacheName)!;
        stats.size = cache.size;
        stats.newestEntry = entry.timestamp;
        if (stats.oldestEntry === 0) {
            stats.oldestEntry = entry.timestamp;
        }

        // Enforce max items limit
        if (config.maxItems && cache.size > config.maxItems) {
            const oldestKey = Array.from(cache.entries())
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            cache.delete(oldestKey);
        }

        // Persist to storage if configured
        if (config.persistToStorage) {
            this.persistCache(cacheName);
        }

        // Track cache set in analytics
        analyticsService.trackUserEvent({
            type: 'cache_set',
            userId: 'system',
            details: {
                cacheName,
                key,
                timestamp: new Date().toISOString()
            }
        });
    }

    public get<T>(cacheName: string, key: string): T | undefined {
        const cache = this.caches.get(cacheName);
        const stats = this.stats.get(cacheName);
        if (!cache || !stats) {
            throw new Error(`Cache ${cacheName} not found`);
        }

        const entry = cache.get(key) as CacheEntry<T>;
        if (!entry) {
            stats.misses++;
            return undefined;
        }

        if (this.isExpired(entry)) {
            cache.delete(key);
            stats.misses++;
            return undefined;
        }

        stats.hits++;
        return entry.value;
    }

    public delete(cacheName: string, key: string): void {
        const cache = this.caches.get(cacheName);
        const config = this.configs.get(cacheName);
        if (!cache || !config) {
            throw new Error(`Cache ${cacheName} not found`);
        }

        cache.delete(key);

        // Update stats
        const stats = this.stats.get(cacheName)!;
        stats.size = cache.size;

        // Persist changes if configured
        if (config.persistToStorage) {
            this.persistCache(cacheName);
        }

        // Track cache delete in analytics
        analyticsService.trackUserEvent({
            type: 'cache_delete',
            userId: 'system',
            details: {
                cacheName,
                key,
                timestamp: new Date().toISOString()
            }
        });
    }

    public clear(cacheName: string): void {
        const cache = this.caches.get(cacheName);
        const config = this.configs.get(cacheName);
        if (!cache || !config) {
            throw new Error(`Cache ${cacheName} not found`);
        }

        cache.clear();

        // Reset stats
        this.stats.set(cacheName, {
            hits: 0,
            misses: 0,
            size: 0,
            oldestEntry: 0,
            newestEntry: 0
        });

        // Persist changes if configured
        if (config.persistToStorage) {
            this.persistCache(cacheName);
        }

        // Track cache clear in analytics
        analyticsService.trackUserEvent({
            type: 'cache_cleared',
            userId: 'system',
            details: {
                cacheName,
                timestamp: new Date().toISOString()
            }
        });
    }

    public clearAll(): void {
        this.caches.forEach((_, name) => this.clear(name));
    }

    public deleteByTags(cacheName: string, tags: string[]): void {
        const cache = this.caches.get(cacheName);
        if (!cache) {
            throw new Error(`Cache ${cacheName} not found`);
        }

        const keysToDelete: string[] = [];
        cache.forEach((entry, key) => {
            if (entry.tags?.some(tag => tags.includes(tag))) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.delete(cacheName, key));
    }

    public getStats(cacheName: string): CacheStats {
        const stats = this.stats.get(cacheName);
        if (!stats) {
            throw new Error(`Cache ${cacheName} not found`);
        }
        return { ...stats };
    }

    private isExpired(entry: CacheEntry): boolean {
        return entry.expiry !== undefined && entry.expiry <= Date.now();
    }

    private cleanup(): void {
        this.caches.forEach((cache, name) => {
            const config = this.configs.get(name)!;
            const now = Date.now();

            // Remove expired entries
            cache.forEach((entry, key) => {
                if (this.isExpired(entry)) {
                    cache.delete(key);
                }
            });

            // Remove old entries based on maxAge
            if (config.maxAge) {
                const threshold = now - config.maxAge;
                cache.forEach((entry, key) => {
                    if (entry.timestamp < threshold) {
                        cache.delete(key);
                    }
                });
            }

            // Update stats
            const stats = this.stats.get(name)!;
            stats.size = cache.size;

            // Persist changes if configured
            if (config.persistToStorage) {
                this.persistCache(name);
            }
        });
    }

    private persistCache(cacheName: string): void {
        const cache = this.caches.get(cacheName);
        if (!cache) {
            return;
        }

        try {
            const entries = Array.from(cache.values());
            localStorage.setItem(`app:cache:${cacheName}`, JSON.stringify(entries));
        } catch (error) {
            console.error(`Failed to persist cache ${cacheName}:`, error);
        }
    }
}

// Create a singleton instance
const cacheService = new CacheService();

export default cacheService;
