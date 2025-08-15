import { EventEmitter } from 'events';
import { logger } from '.js';

export interface CacheConfig {
  maxSize: number;
  ttl: number;
  strategy: 'lru' | 'fifo' | 'ttl';
  compression: boolean;
  persistence: boolean;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  timestamp: Date;
}

export interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunkCount: number;
  chunks: {
    name: string;
    size: number;
    gzippedSize: number;
  }[];
  optimizationScore: number;
  recommendations: string[];
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  timestamp: Date;
}

export interface SecurityMetrics {
  failedRequests: number;
  blockedRequests: number;
  suspiciousActivity: number;
  rateLimitViolations: number;
  xssAttempts: number;
  sqlInjectionAttempts: number;
  timestamp: Date;
}

export interface OptimizationRecommendation {
  type: 'cache' | 'memory' | 'bundle' | 'security' | 'performance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: number;
  effort: number;
  implementation: string;
}

class PerformanceOptimizationService extends EventEmitter {
  private static instance: PerformanceOptimizationService;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private memoryMetrics: MemoryMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private securityMetrics: SecurityMetrics[] = [];
  private bundleMetrics: BundleMetrics | null = null;
  private cacheConfig: CacheConfig;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.cacheConfig = {
      maxSize: 1000,
      ttl: 300000, // 5 minutes
      strategy: 'lru',
      compression: true,
      persistence: false
    };
    this.initializeService();
  }

  public static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  private initializeService(): void {
    console.log('Performance Optimization Service initialized');
    this.startMonitoring();
    this.analyzeBundle();
  }

  /**
   * Advanced caching with multiple strategies
   */
  public async getCachedData<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    this.emit('cacheHit', { key, timestamp: now });
    return cached.data as T;
  }

  public async setCachedData<T>(key: string, data: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const cacheEntry = {
      data,
      timestamp: now,
      ttl: ttl || this.cacheConfig.ttl
    };

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictOldestEntry();
    }

    this.cache.set(key, cacheEntry);
    this.emit('cacheSet', { key, timestamp: now });
  }

  private evictOldestEntry(): void {
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

  /**
   * Memory optimization and monitoring
   */
  public getMemoryMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    const metrics: MemoryMetrics = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rss: memUsage.rss,
      timestamp: new Date()
    };

    this.memoryMetrics.push(metrics);
    if (this.memoryMetrics.length > 100) {
      this.memoryMetrics.shift();
    }

    this.emit('memoryMetrics', metrics);
    return metrics;
  }

  public optimizeMemory(): void {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clear old cache entries
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // Clear old metrics
    if (this.memoryMetrics.length > 50) {
      this.memoryMetrics = this.memoryMetrics.slice(-50);
    }

    this.emit('memoryOptimized');
  }

  /**
   * Bundle analysis and optimization
   */
  public async analyzeBundle(): Promise<BundleMetrics> {
    // Mock bundle analysis - in real implementation, this would analyze actual bundle
    const mockChunks = [
      { name: 'main', size: 512000, gzippedSize: 128000 },
      { name: 'vendor', size: 1024000, gzippedSize: 256000 },
      { name: 'game-mechanics', size: 256000, gzippedSize: 64000 },
      { name: 'tournament', size: 128000, gzippedSize: 32000 }
    ];

    const totalSize = mockChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const gzippedSize = mockChunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);
    const optimizationScore = this.calculateOptimizationScore(totalSize, gzippedSize);
    const recommendations = this.generateBundleRecommendations(mockChunks);

    this.bundleMetrics = {
      totalSize,
      gzippedSize,
      chunkCount: mockChunks.length,
      chunks: mockChunks,
      optimizationScore,
      recommendations
    };

    this.emit('bundleAnalyzed', this.bundleMetrics);
    return this.bundleMetrics;
  }

  private calculateOptimizationScore(totalSize: number, gzippedSize: number): number {
    const compressionRatio = gzippedSize / totalSize;
    const sizeScore = Math.max(0, 100 - (totalSize / 1024 / 1024) * 10); // Penalize large bundles
    const compressionScore = compressionRatio * 50; // Reward good compression
    
    return Math.min(100, sizeScore + compressionScore);
  }

  private generateBundleRecommendations(chunks: any[]): string[] {
    const recommendations: string[] = [];
    
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    if (totalSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push('Consider code splitting to reduce bundle size');
    }

    const largeChunks = chunks.filter(chunk => chunk.size > 500 * 1024); // 500KB
    if (largeChunks.length > 0) {
      recommendations.push('Large chunks detected - consider lazy loading');
    }

    const compressionRatio = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0) / totalSize;
    if (compressionRatio > 0.3) {
      recommendations.push('Bundle compression could be improved');
    }

    return recommendations;
  }

  /**
   * Performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, 30000); // Every 30 seconds

    console.log('Performance monitoring started');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  private collectPerformanceMetrics(): void {
    const memUsage = process.memoryUsage();
    const metrics: PerformanceMetrics = {
      responseTime: this.calculateAverageResponseTime(),
      throughput: this.calculateThroughput(),
      errorRate: this.calculateErrorRate(),
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage: memUsage.heapUsed / memUsage.heapTotal,
      cpuUsage: this.calculateCpuUsage(),
      activeConnections: this.getActiveConnections(),
      timestamp: new Date()
    };

    this.performanceMetrics.push(metrics);
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics.shift();
    }

    this.emit('performanceMetrics', metrics);
    this.checkPerformanceThresholds(metrics);
  }

  private calculateAverageResponseTime(): number {
    // Mock calculation - in real implementation, this would come from actual request data
    return Math.random() * 100 + 50; // 50-150ms
  }

  private calculateThroughput(): number {
    // Mock calculation - requests per second
    return Math.random() * 100 + 50; // 50-150 req/s
  }

  private calculateErrorRate(): number {
    // Mock calculation - error percentage
    return Math.random() * 5; // 0-5%
  }

  private calculateCacheHitRate(): number {
    // Mock calculation - cache hit percentage
    return Math.random() * 30 + 70; // 70-100%
  }

  private calculateCpuUsage(): number {
    // Mock calculation - CPU usage percentage
    return Math.random() * 50 + 20; // 20-70%
  }

  private getActiveConnections(): number {
    // Mock calculation - active connections
    return Math.floor(Math.random() * 100 + 50); // 50-150
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    if (metrics.responseTime > 200) {
      this.emit('performanceWarning', { type: 'responseTime', value: metrics.responseTime });
    }

    if (metrics.errorRate > 5) {
      this.emit('performanceWarning', { type: 'errorRate', value: metrics.errorRate });
    }

    if (metrics.memoryUsage > 0.8) {
      this.emit('performanceWarning', { type: 'memoryUsage', value: metrics.memoryUsage });
    }

    if (metrics.cpuUsage > 80) {
      this.emit('performanceWarning', { type: 'cpuUsage', value: metrics.cpuUsage });
    }
  }

  /**
   * Security monitoring
   */
  public recordSecurityEvent(eventType: string, details: any): void {
    const metrics: SecurityMetrics = {
      failedRequests: details.failedRequests || 0,
      blockedRequests: details.blockedRequests || 0,
      suspiciousActivity: details.suspiciousActivity || 0,
      rateLimitViolations: details.rateLimitViolations || 0,
      xssAttempts: details.xssAttempts || 0,
      sqlInjectionAttempts: details.sqlInjectionAttempts || 0,
      timestamp: new Date()
    };

    this.securityMetrics.push(metrics);
    if (this.securityMetrics.length > 100) {
      this.securityMetrics.shift();
    }

    this.emit('securityEvent', { eventType, metrics });
  }

  /**
   * Generate optimization recommendations
   */
  public generateRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Memory recommendations
    const latestMemory = this.memoryMetrics[this.memoryMetrics.length - 1];
    if (latestMemory && latestMemory.heapUsed / latestMemory.heapTotal > 0.8) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        title: 'High Memory Usage',
        description: 'Memory usage is above 80%. Consider optimizing memory usage.',
        impact: 8,
        effort: 6,
        implementation: 'Implement memory pooling and reduce object allocations'
      });
    }

    // Cache recommendations
    const cacheHitRate = this.calculateCacheHitRate();
    if (cacheHitRate < 80) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${cacheHitRate.toFixed(1)}%. Consider improving caching strategy.`,
        impact: 6,
        effort: 4,
        implementation: 'Implement more aggressive caching and optimize cache keys'
      });
    }

    // Bundle recommendations
    if (this.bundleMetrics && this.bundleMetrics.optimizationScore < 70) {
      recommendations.push({
        type: 'bundle',
        priority: 'medium',
        title: 'Bundle Optimization Needed',
        description: `Bundle optimization score is ${this.bundleMetrics.optimizationScore.toFixed(1)}%.`,
        impact: 7,
        effort: 5,
        implementation: 'Implement code splitting and tree shaking'
      });
    }

    // Performance recommendations
    const latestPerformance = this.performanceMetrics[this.performanceMetrics.length - 1];
    if (latestPerformance && latestPerformance.responseTime > 150) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'High Response Time',
        description: `Average response time is ${latestPerformance.responseTime.toFixed(1)}ms.`,
        impact: 9,
        effort: 7,
        implementation: 'Optimize database queries and implement caching'
      });
    }

    return recommendations.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Production deployment helpers
   */
  public async prepareForProduction(): Promise<void> {
    // Optimize memory
    this.optimizeMemory();

    // Analyze bundle
    await this.analyzeBundle();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Check for critical issues
    const criticalIssues = recommendations.filter(r => r.priority === 'critical');
    if (criticalIssues.length > 0) {
      this.emit('productionWarning', { 
        message: 'Critical issues detected before production deployment',
        issues: criticalIssues
      });
    }

    this.emit('productionReady', { recommendations });
  }

  // Public getter methods
  public getCacheSize(): number {
    return this.cache.size;
  }

  public getMemoryMetrics(): MemoryMetrics[] {
    return [...this.memoryMetrics];
  }

  public getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  public getSecurityMetrics(): SecurityMetrics[] {
    return [...this.securityMetrics];
  }

  public getBundleMetrics(): BundleMetrics | null {
    return this.bundleMetrics;
  }

  public getCacheConfig(): CacheConfig {
    return { ...this.cacheConfig };
  }

  public updateCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    this.emit('cacheConfigUpdated', this.cacheConfig);
  }

  public clearCache(): void {
    this.cache.clear();
    this.emit('cacheCleared');
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

export default PerformanceOptimizationService; 
