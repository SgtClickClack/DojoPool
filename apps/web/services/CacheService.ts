import analyticsService from './AnalyticsService';

interface CacheConfig {
  name: string;
  version: number;
  maxAge?: number;
  maxItems?: number;
  maxMemoryMB?: number;
  persistToStorage?: boolean;
  invalidationStrategy?: 'lru' | 'lfu' | 'fifo';
}

interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiry?: number;
  tags?: string[];
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

interface CachePolicy {
  name: string;
  priority: number;
  shouldCache: (key: string, value: any) => boolean;
  shouldEvict: (entry: CacheEntry) => boolean;
  onHit?: (entry: CacheEntry) => void;
  onMiss?: (key: string) => void;
}

class MemoryManager {
  private memoryUsage: number = 0;
  private readonly maxMemory: number;

  constructor(maxMemoryMB: number = 100) {
    this.maxMemory = maxMemoryMB * 1024 * 1024;
  }

  estimateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2;
    }
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024; // Default size estimation
    }
  }

  canStore(size: number): boolean {
    return this.memoryUsage + size <= this.maxMemory;
  }

  trackUsage(size: number): void {
    this.memoryUsage += size;
  }

  releaseMemory(size: number): void {
    this.memoryUsage = Math.max(0, this.memoryUsage - size);
  }

  getCurrentUsage(): number {
    return this.memoryUsage;
  }

  getLimit(): number {
    return this.maxMemory;
  }
}

class InvalidationStrategy {
  static getLRUKey(entries: Map<string, CacheEntry>): string {
    let lruKey = '';
    let lruTime = Infinity;

    entries.forEach((entry, key) => {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    });

    return lruKey;
  }

  static getLFUKey(entries: Map<string, CacheEntry>): string {
    let lfuKey = '';
    let lfuCount = Infinity;

    entries.forEach((entry, key) => {
      if (entry.accessCount < lfuCount) {
        lfuCount = entry.accessCount;
        lfuKey = key;
      }
    });

    return lfuKey;
  }

  static getFIFOKey(entries: Map<string, CacheEntry>): string {
    let fifoKey = '';
    let oldestTime = Infinity;

    entries.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        fifoKey = key;
      }
    });

    return fifoKey;
  }
}

class CacheHierarchy {
  private levels: Map<string, Map<string, CacheEntry>> = new Map();
  private policies: Map<string, CachePolicy> = new Map();

  constructor() {
    // Initialize default cache levels
    this.levels.set('memory', new Map()); // Fastest, smallest
    this.levels.set('storage', new Map()); // Slower, larger

    // Set default policies
    this.policies.set('critical', {
      name: 'critical',
      priority: 1,
      shouldCache: (key, value) => true, // Cache all critical data
      shouldEvict: (entry) => false, // Never evict critical data
      onHit: (entry) => entry.accessCount++,
      onMiss: (key) => console.warn(`Cache miss for critical data: ${key}`),
    });

    this.policies.set('frequent', {
      name: 'frequent',
      priority: 2,
      shouldCache: (key, value) => true,
      shouldEvict: (entry) =>
        entry.accessCount < 5 && Date.now() - entry.timestamp > 3600000,
      onHit: (entry) => entry.accessCount++,
    });

    this.policies.set('temporary', {
      name: 'temporary',
      priority: 3,
      shouldCache: (key, value) => true,
      shouldEvict: (entry) => Date.now() - entry.timestamp > 300000, // 5 minutes
    });
  }

  async get(key: string, policy: string = 'frequent'): Promise<any> {
    const selectedPolicy = this.policies.get(policy);
    if (!selectedPolicy) {
      throw new Error(`Cache policy ${policy} not found`);
    }

    // Try memory first
    const memoryEntry = this.levels.get('memory')?.get(key);
    if (memoryEntry) {
      selectedPolicy.onHit?.(memoryEntry);
      return memoryEntry.value;
    }

    // Try storage
    const storageEntry = this.levels.get('storage')?.get(key);
    if (storageEntry) {
      // Promote to memory if policy allows
      if (selectedPolicy.shouldCache(key, storageEntry.value)) {
        this.levels.get('memory')?.set(key, storageEntry);
      }
      selectedPolicy.onHit?.(storageEntry);
      return storageEntry.value;
    }

    selectedPolicy.onMiss?.(key);
    return null;
  }

  async set(
    key: string,
    value: any,
    policy: string = 'frequent'
  ): Promise<void> {
    const selectedPolicy = this.policies.get(policy);
    if (!selectedPolicy) {
      throw new Error(`Cache policy ${policy} not found`);
    }

    if (!selectedPolicy.shouldCache(key, value)) {
      return;
    }

    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size: 0, // Will be calculated by MemoryManager
    };

    // Store in appropriate levels based on policy priority
    if (selectedPolicy.priority <= 2) {
      // Critical and frequent data
      this.levels.get('memory')?.set(key, entry);
    }
    if (selectedPolicy.priority <= 3) {
      // All data
      this.levels.get('storage')?.set(key, entry);
    }
  }

  async evict(policy: string): Promise<void> {
    const selectedPolicy = this.policies.get(policy);
    if (!selectedPolicy) {
      throw new Error(`Cache policy ${policy} not found`);
    }

    for (const [level, cache] of this.levels) {
      const entriesToEvict: string[] = [];

      cache.forEach((entry, key) => {
        if (selectedPolicy.shouldEvict(entry)) {
          entriesToEvict.push(key);
        }
      });

      entriesToEvict.forEach((key) => cache.delete(key));
    }
  }

  addPolicy(policy: CachePolicy): void {
    this.policies.set(policy.name, policy);
  }

  removePolicy(name: string): void {
    this.policies.delete(name);
  }
}

class CacheService {
  private caches: Map<string, Map<string, CacheEntry>> = new Map();
  private configs: Map<string, CacheConfig> = new Map();
  private stats: Map<string, CacheStats> = new Map();
  private memoryManagers: Map<string, MemoryManager> = new Map();
  private hierarchy: CacheHierarchy;
  private maintenanceInterval: number;

  constructor() {
    this.hierarchy = new CacheHierarchy();
    this.initializeFromStorage();
    this.setupCleanupInterval();

    // Add custom policies for different cache types
    this.hierarchy.addPolicy({
      name: 'assets',
      priority: 1,
      shouldCache: (key, value) => true,
      shouldEvict: (entry) =>
        entry.accessCount < 3 && Date.now() - entry.timestamp > 86400000, // 24 hours
      onHit: (entry) => {
        entry.accessCount++;
        analyticsService.trackUserEvent({
          type: 'cache_asset_hit',
          userId: 'system',
          details: { key: entry.key },
        });
      },
    });

    this.hierarchy.addPolicy({
      name: 'api',
      priority: 2,
      shouldCache: (key, value) => true,
      shouldEvict: (entry) => Date.now() - entry.timestamp > 300000, // 5 minutes
      onMiss: (key) => {
        analyticsService.trackUserEvent({
          type: 'cache_api_miss',
          userId: 'system',
          details: { key },
        });
      },
    });
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
            entries.forEach((entry) => cache.set(entry.key, entry));
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize caches from storage:', error);
      localStorage.removeItem('app:caches');
    }
  }

  private setupCleanupInterval(): void {
    this.maintenanceInterval = window.setInterval(() => {
      this.performMaintenance();
    }, 60000); // Run maintenance every minute
  }

  private performMaintenance(): void {
    const now = Date.now();

    this.caches.forEach((cache, name) => {
      const config = this.configs.get(name)!;
      const memoryManager = this.memoryManagers.get(name)!;
      const stats = this.stats.get(name)!;

      // Remove expired entries
      cache.forEach((entry, key) => {
        if (entry.expiry && entry.expiry <= now) {
          this.removeEntry(name, key, entry);
        }
      });

      // Check memory limits
      if (config.maxMemoryMB) {
        while (memoryManager.getCurrentUsage() > memoryManager.getLimit()) {
          const keyToRemove = this.getKeyToInvalidate(
            cache,
            config.invalidationStrategy || 'lru'
          );
          if (keyToRemove) {
            this.removeEntry(name, keyToRemove, cache.get(keyToRemove)!);
          } else {
            break;
          }
        }
      }

      // Update stats
      stats.size = cache.size;
      stats.memoryUsage = memoryManager.getCurrentUsage();
    });
  }

  private getKeyToInvalidate(
    cache: Map<string, CacheEntry>,
    strategy: string
  ): string {
    switch (strategy) {
      case 'lru':
        return InvalidationStrategy.getLRUKey(cache);
      case 'lfu':
        return InvalidationStrategy.getLFUKey(cache);
      case 'fifo':
        return InvalidationStrategy.getFIFOKey(cache);
      default:
        return InvalidationStrategy.getLRUKey(cache);
    }
  }

  private removeEntry(cacheName: string, key: string, entry: CacheEntry): void {
    const cache = this.caches.get(cacheName)!;
    const memoryManager = this.memoryManagers.get(cacheName)!;

    cache.delete(key);
    memoryManager.releaseMemory(entry.size);

    analyticsService.trackUserEvent({
      type: 'cache_entry_removed',
      userId: 'system',
      details: {
        cacheName,
        key,
        reason:
          entry.expiry && entry.expiry <= Date.now() ? 'expired' : 'evicted',
        timestamp: new Date().toISOString(),
      },
    });
  }

  public createCache(config: CacheConfig): void {
    if (this.caches.has(config.name)) {
      throw new Error(`Cache ${config.name} already exists`);
    }

    this.caches.set(config.name, new Map());
    this.configs.set(config.name, config);
    this.memoryManagers.set(config.name, new MemoryManager(config.maxMemoryMB));
    this.stats.set(config.name, {
      hits: 0,
      misses: 0,
      size: 0,
      memoryUsage: 0,
      oldestEntry: Date.now(),
      newestEntry: Date.now(),
    });

    if (config.persistToStorage) {
      const caches = Object.fromEntries(this.configs.entries());
      localStorage.setItem('app:caches', JSON.stringify(caches));
    }

    analyticsService.trackUserEvent({
      type: 'cache_created',
      userId: 'system',
      details: {
        cacheName: config.name,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public async set<T>(
    cacheName: string,
    key: string,
    value: T,
    options: {
      maxAge?: number;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    const memoryManager = this.memoryManagers.get(cacheName);
    if (!cache || !config || !memoryManager) {
      throw new Error(`Cache ${cacheName} not found`);
    }

    // Store in hierarchy
    await this.hierarchy.set(key, value, cacheName);

    // Continue with existing implementation
    const size = memoryManager.estimateSize(value);

    if (!memoryManager.canStore(size)) {
      while (!memoryManager.canStore(size) && cache.size > 0) {
        const keyToRemove = this.getKeyToInvalidate(
          cache,
          config.invalidationStrategy || 'lru'
        );
        if (keyToRemove) {
          this.removeEntry(cacheName, keyToRemove, cache.get(keyToRemove)!);
        } else {
          break;
        }
      }

      if (!memoryManager.canStore(size)) {
        console.warn(
          `Cannot cache ${key} in ${cacheName}: insufficient memory`
        );
        return;
      }
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      expiry: options.maxAge ? Date.now() + options.maxAge : undefined,
      tags: options.tags,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
    };

    // Remove old entry if exists
    const oldEntry = cache.get(key);
    if (oldEntry) {
      memoryManager.releaseMemory(oldEntry.size);
    }

    cache.set(key, entry);
    memoryManager.trackUsage(size);

    // Update stats
    const stats = this.stats.get(cacheName)!;
    stats.size = cache.size;
    stats.memoryUsage = memoryManager.getCurrentUsage();
    stats.newestEntry = entry.timestamp;
    if (stats.oldestEntry === 0) {
      stats.oldestEntry = entry.timestamp;
    }

    // Enforce max items limit
    if (config.maxItems && cache.size > config.maxItems) {
      const keyToRemove = this.getKeyToInvalidate(
        cache,
        config.invalidationStrategy || 'lru'
      );
      if (keyToRemove) {
        this.removeEntry(cacheName, keyToRemove, cache.get(keyToRemove)!);
      }
    }

    // Persist to storage if configured
    if (config.persistToStorage) {
      this.persistCache(cacheName);
    }

    analyticsService.trackUserEvent({
      type: 'cache_set',
      userId: 'system',
      details: {
        cacheName,
        key,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public async get<T>(cacheName: string, key: string): Promise<T | undefined> {
    const cache = this.caches.get(cacheName);
    const stats = this.stats.get(cacheName);
    if (!cache || !stats) {
      throw new Error(`Cache ${cacheName} not found`);
    }

    // Try hierarchical cache first
    const hierarchyResult = await this.hierarchy.get(key, cacheName);
    if (hierarchyResult !== null) {
      stats.hits++;
      return hierarchyResult as T;
    }

    const entry = cache.get(key);
    if (!entry) {
      stats.misses++;
      return undefined;
    }

    if (entry.expiry && entry.expiry <= Date.now()) {
      this.removeEntry(cacheName, key, entry);
      stats.misses++;
      return undefined;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    stats.hits++;

    // Store in hierarchy for future access
    await this.hierarchy.set(key, entry.value, cacheName);

    return entry.value as T;
  }

  public invalidate(cacheName: string, key: string): void {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      throw new Error(`Cache ${cacheName} not found`);
    }

    const entry = cache.get(key);
    if (entry) {
      this.removeEntry(cacheName, key, entry);
    }
  }

  public invalidateByTags(cacheName: string, tags: string[]): void {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      throw new Error(`Cache ${cacheName} not found`);
    }

    cache.forEach((entry, key) => {
      if (entry.tags?.some((tag) => tags.includes(tag))) {
        this.removeEntry(cacheName, key, entry);
      }
    });
  }

  public clear(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    const memoryManager = this.memoryManagers.get(cacheName);
    if (!cache || !config || !memoryManager) {
      throw new Error(`Cache ${cacheName} not found`);
    }

    // Clear all entries
    cache.forEach((entry, key) => {
      this.removeEntry(cacheName, key, entry);
    });

    // Reset stats
    this.stats.set(cacheName, {
      hits: 0,
      misses: 0,
      size: 0,
      memoryUsage: 0,
      oldestEntry: 0,
      newestEntry: 0,
    });

    // Persist changes if configured
    if (config.persistToStorage) {
      this.persistCache(cacheName);
    }

    analyticsService.trackUserEvent({
      type: 'cache_cleared',
      userId: 'system',
      details: {
        cacheName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public clearAll(): void {
    this.caches.forEach((_, name) => this.clear(name));
  }

  public getStats(cacheName: string): CacheStats {
    const stats = this.stats.get(cacheName);
    if (!stats) {
      throw new Error(`Cache ${cacheName} not found`);
    }
    return { ...stats };
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

  public destroy(): void {
    clearInterval(this.maintenanceInterval);
    this.clearAll();
  }
}

export default new CacheService();
