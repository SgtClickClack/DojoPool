import { CACHE_CONFIG } from '../../constants';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly ttl: number;
  private readonly maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    ttl = CACHE_CONFIG.DEFAULT_TTL,
    maxSize = CACHE_CONFIG.MAX_SIZE,
    cleanupInterval = CACHE_CONFIG.CLEANUP_INTERVAL
  ) {
    this.ttl = ttl;
    this.maxSize = maxSize;
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupInterval);
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
      if (this.cache.size >= this.maxSize) {
        const oldestKey = Array.from(this.cache.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
} 