import { io, Socket } from 'socket.io-client';

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  responseTime: number;
  activeConnections: number;
  cacheHitRate: number;
  databaseQueries: number;
  errorRate: number;
  timestamp: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  memoryUsage: number;
}

export interface OptimizationConfig {
  maxCacheSize: number;
  cacheTtl: number;
  maxMemoryUsage: number;
  cleanupInterval: number;
  compressionEnabled: boolean;
  preloadEnabled: boolean;
}

class TournamentPerformanceService {
  private socket: Socket | null = null;
  private static instance: TournamentPerformanceService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  private constructor() {
    this.config = {
      maxCacheSize: 1000,
      cacheTtl: 300000, // 5 minutes
      maxMemoryUsage: 0.8, // 80% of available memory
      cleanupInterval: 60000, // 1 minute
      compressionEnabled: true,
      preloadEnabled: true,
    };
    this.initializeSocket();
    this.startCleanupInterval();
  }

  public static getInstance(): TournamentPerformanceService {
    if (!TournamentPerformanceService.instance) {
      TournamentPerformanceService.instance = new TournamentPerformanceService();
    }
    return TournamentPerformanceService.instance;
  }

  private initializeSocket(): void {
    this.socket = io('http://localhost:8080');
    
    this.socket.on('connect', () => {
      console.log('TournamentPerformanceService connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('TournamentPerformanceService disconnected from server');
    });
  }

  // Cache Management
  public setCache<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTtl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Check if cache is full and evict if necessary
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, entry);
    this.socket?.emit('cache-updated', { key, action: 'set' });
  }

  public getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.socket?.emit('cache-miss', { key });
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.socket?.emit('cache-expired', { key });
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.cache.set(key, entry);
    
    this.socket?.emit('cache-hit', { key });
    return entry.data;
  }

  public deleteCache(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.socket?.emit('cache-updated', { key, action: 'delete' });
    }
    return deleted;
  }

  public clearCache(): void {
    this.cache.clear();
    this.socket?.emit('cache-cleared');
  }

  public getCacheStats(): CacheStats {
    const totalEntries = this.cache.size;
    const totalSize = this.calculateCacheSize();
    const hitRate = this.calculateHitRate();
    const missRate = 1 - hitRate;
    const evictions = this.getEvictionCount();
    const memoryUsage = this.getMemoryUsage();

    return {
      totalEntries,
      totalSize,
      hitRate,
      missRate,
      evictions,
      memoryUsage,
    };
  }

  // Performance Monitoring
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorPerformance();
    
    this.socket?.emit('performance-monitoring-started');
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.socket?.emit('performance-monitoring-stopped');
  }

  public getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  // Memory Management
  public optimizeMemory(): void {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage > this.config.maxMemoryUsage) {
      this.performMemoryCleanup();
    }
  }

  public compressData<T>(data: T): string {
    if (!this.config.compressionEnabled) {
      return JSON.stringify(data);
    }

    // Simple compression - in production, use a proper compression library
    const jsonString = JSON.stringify(data);
    return btoa(jsonString); // Base64 encoding as simple compression
  }

  public decompressData<T>(compressedData: string): T {
    if (!this.config.compressionEnabled) {
      return JSON.parse(compressedData);
    }

    // Simple decompression
    const jsonString = atob(compressedData); // Base64 decoding
    return JSON.parse(jsonString);
  }

  // Preloading and Predictive Caching
  public preloadData(keys: string[]): void {
    if (!this.config.preloadEnabled) return;

    keys.forEach(key => {
      // Simulate preloading data
      this.socket?.emit('data-preload-requested', { key });
    });
  }

  public predictAndCache(pattern: string): void {
    // Predict what data might be needed based on pattern
    const predictedKeys = this.generatePredictedKeys(pattern);
    this.preloadData(predictedKeys);
  }

  // Configuration Management
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('performance-config-updated', this.config);
  }

  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  // Private helper methods
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
      this.optimizeMemory();
    }, this.config.cleanupInterval);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      this.socket?.emit('cache-cleanup', { expiredCount: expiredKeys.length });
    }
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let lowestAccessCount = Infinity;
    let oldestAccess = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.accessCount < lowestAccessCount || 
          (entry.accessCount === lowestAccessCount && entry.lastAccessed < oldestAccess)) {
        leastUsedKey = key;
        lowestAccessCount = entry.accessCount;
        oldestAccess = entry.lastAccessed;
      }
    });

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.socket?.emit('cache-evicted', { key: leastUsedKey });
    }
  }

  private performMemoryCleanup(): void {
    // Remove least recently used entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const entriesToRemove = Math.floor(entries.length * 0.2); // Remove 20% of entries
    for (let i = 0; i < entriesToRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    this.socket?.emit('memory-cleanup-performed', { removedEntries: entriesToRemove });
  }

  private monitorPerformance(): void {
    const monitorInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(monitorInterval);
        return;
      }

      const metrics: PerformanceMetrics = {
        cpuUsage: this.getCpuUsage(),
        memoryUsage: this.getMemoryUsage(),
        networkLatency: this.getNetworkLatency(),
        responseTime: this.getResponseTime(),
        activeConnections: this.getActiveConnections(),
        cacheHitRate: this.calculateHitRate(),
        databaseQueries: this.getDatabaseQueries(),
        errorRate: this.getErrorRate(),
        timestamp: Date.now(),
      };

      this.metrics.push(metrics);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      this.socket?.emit('performance-metrics', metrics);
    }, 5000); // Update every 5 seconds
  }

  private calculateCacheSize(): number {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += JSON.stringify(entry.data).length;
    });
    return totalSize;
  }

  private calculateHitRate(): number {
    // Mock hit rate calculation
    return Math.random() * 0.3 + 0.7; // 70-100%
  }

  private getEvictionCount(): number {
    // Mock eviction count
    return Math.floor(Math.random() * 10);
  }

  private getMemoryUsage(): number {
    // Mock memory usage
    return Math.random() * 0.4 + 0.3; // 30-70%
  }

  private getCpuUsage(): number {
    // Mock CPU usage
    return Math.random() * 40 + 20; // 20-60%
  }

  private getNetworkLatency(): number {
    // Mock network latency
    return Math.random() * 100 + 50; // 50-150ms
  }

  private getResponseTime(): number {
    // Mock response time
    return Math.random() * 200 + 100; // 100-300ms
  }

  private getActiveConnections(): number {
    // Mock active connections
    return Math.floor(Math.random() * 50 + 10); // 10-60 connections
  }

  private getDatabaseQueries(): number {
    // Mock database queries
    return Math.floor(Math.random() * 100 + 20); // 20-120 queries
  }

  private getErrorRate(): number {
    // Mock error rate
    return Math.random() * 0.05; // 0-5%
  }

  private generatePredictedKeys(pattern: string): string[] {
    // Mock predicted keys based on pattern
    return [
      `${pattern}_recent`,
      `${pattern}_popular`,
      `${pattern}_trending`,
      `${pattern}_related`,
    ];
  }

  public disconnect(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.stopMonitoring();
    this.socket?.disconnect();
  }
}

export default TournamentPerformanceService; 
