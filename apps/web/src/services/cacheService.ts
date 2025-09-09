import { useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version?: string;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  version?: string; // Cache version for invalidation
  enableCompression?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAge: number;
}

class FrontendCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private readonly defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    enableCompression: false,
  };

  constructor(private config: Partial<CacheConfig> = {}) {
    this.config = { ...this.defaultConfig, ...this.config };
    this.startCleanupInterval();
  }

  async set<T>(
    key: string,
    data: T,
    options: Partial<CacheConfig> = {}
  ): Promise<void> {
    const finalConfig = { ...this.config, ...options };

    // Enforce size limit
    if (this.cache.size >= finalConfig.maxSize!) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: finalConfig.ttl!,
      version: finalConfig.version,
    };

    this.cache.set(key, entry);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Check version mismatch
    if (entry.version && entry.version !== this.config.version) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    let totalAge = 0;
    const now = Date.now();
    for (const entry of this.cache.values()) {
      totalAge += now - entry.timestamp;
    }
    const averageAge = this.cache.size > 0 ? totalAge / this.cache.size : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate,
      averageAge,
    };
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern);
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }
}

// Singleton instance
export const frontendCache = new FrontendCacheService();

// React hook for cache operations
export const useCache = () => {
  const setCache = useCallback(
    async <T>(key: string, data: T, options?: Partial<CacheConfig>) => {
      await frontendCache.set(key, data, options);
    },
    []
  );

  const getCache = useCallback(
    async <T>(key: string): Promise<T | null> => {
      return await frontendCache.get<T>(key);
    },
    []
  );

  const deleteCache = useCallback(
    async (key: string): Promise<boolean> => {
      return await frontendCache.delete(key);
    },
    []
  );

  const clearCache = useCallback(async () => {
    await frontendCache.clear();
  }, []);

  const getStats = useCallback(async (): Promise<CacheStats> => {
    return await frontendCache.getStats();
  }, []);

  return {
    setCache,
    getCache,
    deleteCache,
    clearCache,
    getStats,
  };
};
