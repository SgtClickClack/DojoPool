import { CacheEntry } from "../../types/monitoring";

export class MetricsCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set<T>(key: string, value: T, ttl: number = 3600000): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getSize(): number {
    return this.cache.size;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  values<T>(): IterableIterator<T> {
    return Array.from(this.cache.values())
      .map((entry) => entry.value)
      [Symbol.iterator]();
  }

  entries<T>(): IterableIterator<[string, T]> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => [key, entry.value] as [string, T])
      [Symbol.iterator]();
  }

  public getMetrics<T>(): Map<string, T> {
    const metrics = new Map<string, T>();

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith("metrics:")) {
        const dependencyName = key.replace("metrics:", "");
        metrics.set(dependencyName, entry.value);
      }
    }

    return metrics;
  }
}
