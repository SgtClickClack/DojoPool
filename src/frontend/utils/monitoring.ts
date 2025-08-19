import { EventEmitter } from 'events';
import { type ErrorInfo } from 'react';
import { type Alert } from '../types/monitoring';

interface MetricData {
  timestamp: number;
  value: number;
  label: string;
  category: 'performance' | 'resources' | 'errors' | 'warnings';
}

interface MetricsSnapshot {
  timestamp: number;
  current: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkSent: number;
    networkReceived: number;
    memoryAvailable: number;
    processCount: number;
    threadCount: number;
  };
  historical: {
    cpuUsage: MetricData[];
    memoryUsage: MetricData[];
    diskUsage: MetricData[];
    networkTraffic: MetricData[];
    memoryAvailable: MetricData[];
  };
  alerts: Alert[];
  latencyData: MetricData[];
  errorData: {
    id: string;
    type: string;
    message: string;
    stack: string;
    timestamp: number;
    component: string;
    context: Record<string, any>;
  }[];
  updateTimes: MetricData[];
  successRate: number[];
}

interface GameMetrics {
  errorCount: number;
  warningCount: number;
  lastError?: {
    timestamp: number;
    message: string;
  };
  errorRate: number;
}

interface ErrorEvent {
  id: string;
  timestamp: number;
  type: 'validation' | 'connection' | 'system' | 'boundary';
  severity: 'error' | 'warning' | 'info';
  message: string;
  playerId?: string;
  details?: Record<string, any>;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Array<{
    error: Error;
    errorInfo: ErrorInfo;
    timestamp: number;
    componentStack?: string;
  }> = [];

  private constructor() {}

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  trackError(error: Error, errorInfo: ErrorInfo): void {
    this.errors.push({
      error,
      errorInfo,
      timestamp: Date.now(),
      componentStack: errorInfo.componentStack,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorTracker:', {
        error,
        errorInfo,
        componentStack: errorInfo.componentStack,
      });
    }

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // This would be implemented to send errors to your error tracking service
    console.error('Error reported to service:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
  }

  getErrors(): Array<{
    error: Error;
    errorInfo: ErrorInfo;
    timestamp: number;
    componentStack?: string;
  }> {
    return [...this.errors];
  }

  getRecentErrors(timeWindow: number = 3600000): Array<{
    error: Error;
    errorInfo: ErrorInfo;
    timestamp: number;
    componentStack?: string;
  }> {
    const now = Date.now();
    return this.errors.filter((error) => now - error.timestamp <= timeWindow);
  }

  getErrorStats(): ErrorStats {
    const now = Date.now();
    const recentErrors = this.errors
      .filter((e) => now - e.timestamp <= 3600000) // Last hour
      .map(({ error, errorInfo, timestamp }) => ({
        error,
        context: {
          component:
            errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
          timestamp,
        },
      }));

    const byType: Record<string, number> = {};
    const byComponent: Record<string, number> = {};

    recentErrors.forEach(({ error, context }) => {
      const type = error.name || 'Unknown';
      const component = context.component || 'Unknown';

      byType[type] = (byType[type] || 0) + 1;
      byComponent[component] = (byComponent[component] || 0) + 1;
    });

    return {
      total: recentErrors.length,
      byType,
      byComponent,
      recentErrors,
    };
  }

  async analyzeErrorTrends(): Promise<ErrorTrends> {
    const stats = this.getErrorStats();
    const now = Date.now();
    const hourAgo = now - 3600000;

    // Calculate error rates per component
    const errorRates = Object.entries(stats.byComponent).map(
      ([component, count]) => ({
        component,
        rate: (count / 3600) * 1000, // errors per hour
      })
    );

    // Get top error types
    const topErrorTypes = Object.entries(stats.byType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Get top components
    const topComponents = Object.entries(stats.byComponent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([component, count]) => ({ component, count }));

    // Calculate recent trends (last hour in 5-minute intervals)
    const intervals = 12;
    const intervalSize = 3600000 / intervals;
    const recentTrends = Array.from({ length: intervals }, (_, i) => {
      const intervalStart = hourAgo + i * intervalSize;
      const intervalEnd = intervalStart + intervalSize;
      return {
        timestamp: intervalStart,
        errorCount: this.errors.filter(
          (e) => e.timestamp >= intervalStart && e.timestamp < intervalEnd
        ).length,
      };
    });

    return {
      topErrorTypes,
      topComponents,
      errorRates,
      recentTrends,
    };
  }
}

export class GameMetricsMonitor extends EventEmitter {
  private static instance: GameMetricsMonitor;
  private metrics: Map<string, GameMetrics> = new Map();
  private errorHistory: Map<
    string,
    Array<{ timestamp: number; type: string }>
  > = new Map();
  private readonly RATE_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds
  private updateTimes: MetricData[] = [];
  private latencyData: MetricData[] = [];
  private memoryUsageData: MetricData[] = [];
  private cpuUsageData: MetricData[] = [];
  private errorRateData: MetricData[] = [];
  private requestRateData: MetricData[] = [];
  private errorTracker: ErrorTracker;
  private alerts: Alert[] = [];
  private diskUsageData: MetricData[] = [];
  private memoryAvailableData: MetricData[] = [];
  private networkTrafficData: MetricData[] = [];
  private processStatsData: MetricData[] = [];
  private fpsData: MetricData[] = [];
  private inputLatencyData: MetricData[] = [];
  private syncLatencyData: MetricData[] = [];
  private renderTimeData: MetricData[] = [];
  private physicsTimeData: MetricData[] = [];
  private assetLoadTimeData: MetricData[] = [];
  private shaderCompileTimeData: MetricData[] = [];
  private textureLoadTimeData: MetricData[] = [];
  private modelLoadTimeData: MetricData[] = [];
  private audioLoadTimeData: MetricData[] = [];

  private readonly THRESHOLDS = {
    cpu: {
      critical: 90, // 90% CPU usage
      warning: 75, // 75% CPU usage
    },
    memory: {
      critical: 85, // 85% memory usage
      warning: 70, // 70% memory usage
    },
    disk: {
      critical: 90, // 90% disk usage
      warning: 80, // 80% disk usage
    },
    network: {
      critical: 1000, // 1000 KB/s
      warning: 800, // 800 KB/s
    },
    errors: {
      critical: 10, // 10 errors per minute
      warning: 5, // 5 errors per minute
    },
  };

  private readonly GAME_THRESHOLDS = {
    fps: {
      critical: 30, // Below 30 FPS is critical
      warning: 45, // Below 45 FPS is warning
      target: 60, // Target 60 FPS
    },
    inputLatency: {
      critical: 100, // Above 100ms is critical
      warning: 50, // Above 50ms is warning
      target: 16, // Target 16ms (60 FPS)
    },
    syncLatency: {
      critical: 200, // Above 200ms is critical
      warning: 100, // Above 100ms is warning
      target: 50, // Target 50ms
    },
    renderTime: {
      critical: 20, // Above 20ms is critical
      warning: 12, // Above 12ms is warning
      target: 8, // Target 8ms
    },
    physicsTime: {
      critical: 16, // Above 16ms is critical
      warning: 12, // Above 12ms is warning
      target: 8, // Target 8ms
    },
  };

  private readonly ASSET_THRESHOLDS = {
    assetLoad: {
      critical: 5000, // 5 seconds
      warning: 2000, // 2 seconds
      target: 1000, // 1 second
    },
    shaderCompile: {
      critical: 1000, // 1 second
      warning: 500, // 500ms
      target: 100, // 100ms
    },
    textureLoad: {
      critical: 2000, // 2 seconds
      warning: 1000, // 1 second
      target: 500, // 500ms
    },
    modelLoad: {
      critical: 3000, // 3 seconds
      warning: 1500, // 1.5 seconds
      target: 750, // 750ms
    },
    audioLoad: {
      critical: 1500, // 1.5 seconds
      warning: 750, // 750ms
      target: 250, // 250ms
    },
  };

  private constructor() {
    super();
    this.errorTracker = ErrorTracker.getInstance();
    this.initializeMetrics();
  }

  private initializeMetrics(gameId?: string) {
    if (gameId) {
      if (!this.metrics.has(gameId)) {
        this.metrics.set(gameId, {
          errorCount: 0,
          warningCount: 0,
          errorRate: 0,
        });
        this.errorHistory.set(gameId, []);
      }
    } else {
      // Initialize global metrics
      this.initializeGlobalMetrics();
    }
  }

  private initializeGlobalMetrics() {
    // Initialize with some sample data
    const now = Date.now();
    const baseTime = now - 24 * 60 * 60 * 1000; // 24 hours ago

    // Clear existing data
    this.updateTimes = [];
    this.latencyData = [];
    this.memoryUsageData = [];
    this.cpuUsageData = [];
    this.errorRateData = [];
    this.requestRateData = [];
    this.diskUsageData = [];
    this.networkTrafficData = [];
    this.processStatsData = [];

    this.fpsData = [];
    this.inputLatencyData = [];
    this.syncLatencyData = [];
    this.renderTimeData = [];
    this.physicsTimeData = [];

    this.assetLoadTimeData = [];
    this.shaderCompileTimeData = [];
    this.textureLoadTimeData = [];
    this.modelLoadTimeData = [];
    this.audioLoadTimeData = [];

    for (let i = 0; i < 24; i++) {
      const timestamp = baseTime + i * 60 * 60 * 1000;
      this.updateTimes.push({
        timestamp,
        value: Math.random() * 100,
        label: 'Update Time',
        category: 'performance',
      });
      this.latencyData.push({
        timestamp,
        value: Math.random() * 200,
        label: 'Latency',
        category: 'performance',
      });
      this.memoryUsageData.push({
        timestamp,
        value: Math.random() * 80,
        label: 'Memory Usage',
        category: 'resources',
      });
      this.cpuUsageData.push({
        timestamp,
        value: Math.random() * 100,
        label: 'CPU Usage',
        category: 'resources',
      });
      this.errorRateData.push({
        timestamp,
        value: Math.random() * 5,
        label: 'Error Rate',
        category: 'errors',
      });
      this.requestRateData.push({
        timestamp,
        value: Math.random() * 1000,
        label: 'Request Rate',
        category: 'performance',
      });
      this.diskUsageData.push({
        timestamp,
        value: 0, // Will be updated with real values
        label: 'Disk Usage',
        category: 'resources',
      });
      this.networkTrafficData.push({
        timestamp,
        value: 0,
        label: 'Network Traffic',
        category: 'performance',
      });
      this.processStatsData.push({
        timestamp,
        value: 0,
        label: 'Process Count',
        category: 'resources',
      });

      this.fpsData.push({
        timestamp,
        value: 60, // Initialize with ideal FPS
        label: 'FPS',
        category: 'performance',
      });

      this.inputLatencyData.push({
        timestamp,
        value: 16, // Initialize with ideal input latency
        label: 'Input Latency',
        category: 'performance',
      });

      this.syncLatencyData.push({
        timestamp,
        value: 50, // Initialize with ideal sync latency
        label: 'Sync Latency',
        category: 'performance',
      });

      this.renderTimeData.push({
        timestamp,
        value: 8, // Initialize with ideal render time
        label: 'Render Time',
        category: 'performance',
      });

      this.physicsTimeData.push({
        timestamp,
        value: 8, // Initialize with ideal physics time
        label: 'Physics Time',
        category: 'performance',
      });

      this.assetLoadTimeData.push({
        timestamp,
        value: 0,
        label: 'Asset Load Time',
        category: 'performance',
      });

      this.shaderCompileTimeData.push({
        timestamp,
        value: 0,
        label: 'Shader Compile Time',
        category: 'performance',
      });

      this.textureLoadTimeData.push({
        timestamp,
        value: 0,
        label: 'Texture Load Time',
        category: 'performance',
      });

      this.modelLoadTimeData.push({
        timestamp,
        value: 0,
        label: 'Model Load Time',
        category: 'performance',
      });

      this.audioLoadTimeData.push({
        timestamp,
        value: 0,
        label: 'Audio Load Time',
        category: 'performance',
      });
    }
  }

  static getInstance(): GameMetricsMonitor {
    if (!GameMetricsMonitor.instance) {
      GameMetricsMonitor.instance = new GameMetricsMonitor();
    }
    return GameMetricsMonitor.instance;
  }

  private async calculateDiskUsage(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usagePercent =
          ((estimate.usage || 0) / (estimate.quota || 1)) * 100;
        return Math.min(usagePercent, 100);
      }
      return 0;
    } catch (error) {
      console.warn('Failed to calculate disk usage:', error);
      return 0;
    }
  }

  private async calculateMemoryAvailable(): Promise<number> {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory) {
          const available = memory.jsHeapSizeLimit - memory.usedJSHeapSize;
          return Math.max(0, available / (1024 * 1024)); // Convert to MB
        }
      }
      return 0;
    } catch (error) {
      console.warn('Failed to calculate available memory:', error);
      return 0;
    }
  }

  private async calculateNetworkStats(): Promise<{
    sent: number;
    received: number;
  }> {
    try {
      if ('performance' in window) {
        const resources = performance.getEntriesByType('resource');
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        let sent = 0;
        let received = 0;

        resources.forEach((resource) => {
          if (resource.startTime >= fiveMinutesAgo) {
            const entry = resource as PerformanceResourceTiming;
            received += entry.transferSize || 0;
            sent += entry.encodedBodySize || 0;
          }
        });

        // Convert to KB
        return {
          sent: Math.round(sent / 1024),
          received: Math.round(received / 1024),
        };
      }
      return { sent: 0, received: 0 };
    } catch (error) {
      console.warn('Failed to calculate network stats:', error);
      return { sent: 0, received: 0 };
    }
  }

  private async calculateProcessStats(): Promise<{
    count: number;
    threadCount: number;
  }> {
    try {
      // For web workers
      const workerCount =
        typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator
          ? navigator.hardwareConcurrency
          : 1;

      // Get active service workers
      const swCount =
        'serviceWorker' in navigator
          ? (await navigator.serviceWorker.getRegistrations()).length
          : 0;

      return {
        count: swCount + 1, // Main process + service workers
        threadCount: workerCount,
      };
    } catch (error) {
      console.warn('Failed to calculate process stats:', error);
      return { count: 1, threadCount: 1 };
    }
  }

  private checkThresholds(metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkStats: { sent: number; received: number };
  }): void {
    // CPU Usage Alert
    if (metrics.cpuUsage >= this.THRESHOLDS.cpu.critical) {
      this.addAlert(
        'error',
        `Critical: CPU usage at ${metrics.cpuUsage.toFixed(1)}%`
      );
    } else if (metrics.cpuUsage >= this.THRESHOLDS.cpu.warning) {
      this.addAlert(
        'warning',
        `Warning: High CPU usage at ${metrics.cpuUsage.toFixed(1)}%`
      );
    }

    // Memory Usage Alert
    if (metrics.memoryUsage >= this.THRESHOLDS.memory.critical) {
      this.addAlert(
        'error',
        `Critical: Memory usage at ${metrics.memoryUsage.toFixed(1)}%`
      );
    } else if (metrics.memoryUsage >= this.THRESHOLDS.memory.warning) {
      this.addAlert(
        'warning',
        `Warning: High memory usage at ${metrics.memoryUsage.toFixed(1)}%`
      );
    }

    // Disk Usage Alert
    if (metrics.diskUsage >= this.THRESHOLDS.disk.critical) {
      this.addAlert(
        'error',
        `Critical: Disk usage at ${metrics.diskUsage.toFixed(1)}%`
      );
    } else if (metrics.diskUsage >= this.THRESHOLDS.disk.warning) {
      this.addAlert(
        'warning',
        `Warning: High disk usage at ${metrics.diskUsage.toFixed(1)}%`
      );
    }

    // Network Traffic Alert
    const networkTotal =
      metrics.networkStats.sent + metrics.networkStats.received;
    if (networkTotal >= this.THRESHOLDS.network.critical) {
      this.addAlert(
        'error',
        `Critical: High network traffic at ${networkTotal.toFixed(1)} KB/s`
      );
    } else if (networkTotal >= this.THRESHOLDS.network.warning) {
      this.addAlert(
        'warning',
        `Warning: Elevated network traffic at ${networkTotal.toFixed(1)} KB/s`
      );
    }
  }

  private checkGameThresholds(metrics: {
    fps: number;
    inputLatency: number;
    syncLatency: number;
    renderTime: number;
    physicsTime: number;
  }): void {
    // FPS Alerts
    if (metrics.fps <= this.GAME_THRESHOLDS.fps.critical) {
      this.addAlert('error', `Critical: Low FPS at ${metrics.fps.toFixed(1)}`);
    } else if (metrics.fps <= this.GAME_THRESHOLDS.fps.warning) {
      this.addAlert(
        'warning',
        `Warning: FPS dropped to ${metrics.fps.toFixed(1)}`
      );
    }

    // Input Latency Alerts
    if (metrics.inputLatency >= this.GAME_THRESHOLDS.inputLatency.critical) {
      this.addAlert(
        'error',
        `Critical: High input latency at ${metrics.inputLatency.toFixed(1)}ms`
      );
    } else if (
      metrics.inputLatency >= this.GAME_THRESHOLDS.inputLatency.warning
    ) {
      this.addAlert(
        'warning',
        `Warning: Input latency at ${metrics.inputLatency.toFixed(1)}ms`
      );
    }

    // Sync Latency Alerts
    if (metrics.syncLatency >= this.GAME_THRESHOLDS.syncLatency.critical) {
      this.addAlert(
        'error',
        `Critical: High sync latency at ${metrics.syncLatency.toFixed(1)}ms`
      );
    } else if (
      metrics.syncLatency >= this.GAME_THRESHOLDS.syncLatency.warning
    ) {
      this.addAlert(
        'warning',
        `Warning: Sync latency at ${metrics.syncLatency.toFixed(1)}ms`
      );
    }

    // Render Time Alerts
    if (metrics.renderTime >= this.GAME_THRESHOLDS.renderTime.critical) {
      this.addAlert(
        'error',
        `Critical: High render time at ${metrics.renderTime.toFixed(1)}ms`
      );
    } else if (metrics.renderTime >= this.GAME_THRESHOLDS.renderTime.warning) {
      this.addAlert(
        'warning',
        `Warning: Render time at ${metrics.renderTime.toFixed(1)}ms`
      );
    }

    // Physics Time Alerts
    if (metrics.physicsTime >= this.GAME_THRESHOLDS.physicsTime.critical) {
      this.addAlert(
        'error',
        `Critical: High physics time at ${metrics.physicsTime.toFixed(1)}ms`
      );
    } else if (
      metrics.physicsTime >= this.GAME_THRESHOLDS.physicsTime.warning
    ) {
      this.addAlert(
        'warning',
        `Warning: Physics time at ${metrics.physicsTime.toFixed(1)}ms`
      );
    }
  }

  private checkAssetThresholds(metrics: {
    assetLoad?: number;
    shaderCompile?: number;
    textureLoad?: number;
    modelLoad?: number;
    audioLoad?: number;
  }): void {
    if (metrics.assetLoad !== undefined) {
      if (metrics.assetLoad >= this.ASSET_THRESHOLDS.assetLoad.critical) {
        this.addAlert(
          'error',
          `Critical: Asset load time ${metrics.assetLoad.toFixed(0)}ms`
        );
      } else if (metrics.assetLoad >= this.ASSET_THRESHOLDS.assetLoad.warning) {
        this.addAlert(
          'warning',
          `Warning: Asset load time ${metrics.assetLoad.toFixed(0)}ms`
        );
      }
    }

    if (metrics.shaderCompile !== undefined) {
      if (
        metrics.shaderCompile >= this.ASSET_THRESHOLDS.shaderCompile.critical
      ) {
        this.addAlert(
          'error',
          `Critical: Shader compile time ${metrics.shaderCompile.toFixed(0)}ms`
        );
      } else if (
        metrics.shaderCompile >= this.ASSET_THRESHOLDS.shaderCompile.warning
      ) {
        this.addAlert(
          'warning',
          `Warning: Shader compile time ${metrics.shaderCompile.toFixed(0)}ms`
        );
      }
    }

    if (metrics.textureLoad !== undefined) {
      if (metrics.textureLoad >= this.ASSET_THRESHOLDS.textureLoad.critical) {
        this.addAlert(
          'error',
          `Critical: Texture load time ${metrics.textureLoad.toFixed(0)}ms`
        );
      } else if (
        metrics.textureLoad >= this.ASSET_THRESHOLDS.textureLoad.warning
      ) {
        this.addAlert(
          'warning',
          `Warning: Texture load time ${metrics.textureLoad.toFixed(0)}ms`
        );
      }
    }

    if (metrics.modelLoad !== undefined) {
      if (metrics.modelLoad >= this.ASSET_THRESHOLDS.modelLoad.critical) {
        this.addAlert(
          'error',
          `Critical: Model load time ${metrics.modelLoad.toFixed(0)}ms`
        );
      } else if (metrics.modelLoad >= this.ASSET_THRESHOLDS.modelLoad.warning) {
        this.addAlert(
          'warning',
          `Warning: Model load time ${metrics.modelLoad.toFixed(0)}ms`
        );
      }
    }

    if (metrics.audioLoad !== undefined) {
      if (metrics.audioLoad >= this.ASSET_THRESHOLDS.audioLoad.critical) {
        this.addAlert(
          'error',
          `Critical: Audio load time ${metrics.audioLoad.toFixed(0)}ms`
        );
      } else if (metrics.audioLoad >= this.ASSET_THRESHOLDS.audioLoad.warning) {
        this.addAlert(
          'warning',
          `Warning: Audio load time ${metrics.audioLoad.toFixed(0)}ms`
        );
      }
    }
  }

  private async calculateAggregatedMetrics(): Promise<{
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkStats: { sent: number; received: number };
    processStats: { count: number; threadCount: number };
  }> {
    const metrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkStats: { sent: 0, received: 0 },
      processStats: { count: 0, threadCount: 0 },
    };

    try {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      // Get recent metrics
      const recentCpuData = this.cpuUsageData.filter(
        (m) => m.timestamp >= fiveMinutesAgo
      );
      const recentMemoryData = this.memoryUsageData.filter(
        (m) => m.timestamp >= fiveMinutesAgo
      );
      const recentDiskData = this.diskUsageData.filter(
        (m) => m.timestamp >= fiveMinutesAgo
      );

      // Calculate averages
      const calculateAverage = (data: MetricData[]) =>
        data.length
          ? data.reduce((sum, m) => sum + m.value, 0) / data.length
          : 0;

      metrics.cpuUsage = calculateAverage(recentCpuData);
      metrics.memoryUsage = calculateAverage(recentMemoryData);
      metrics.diskUsage = await this.calculateDiskUsage();
      metrics.networkStats = await this.calculateNetworkStats();
      metrics.processStats = await this.calculateProcessStats();

      // Check thresholds and generate alerts if needed
      this.checkThresholds(metrics);

      return metrics;
    } catch (error) {
      console.error('Error calculating aggregated metrics:', error);
      return metrics;
    }
  }

  // Update the error rate monitoring to use thresholds
  private checkErrorRateThreshold(errorRate: number): void {
    if (errorRate >= this.THRESHOLDS.errors.critical) {
      this.addAlert(
        'error',
        `Critical: High error rate at ${errorRate.toFixed(1)} errors/minute`
      );
    } else if (errorRate >= this.THRESHOLDS.errors.warning) {
      this.addAlert(
        'warning',
        `Warning: Elevated error rate at ${errorRate.toFixed(1)} errors/minute`
      );
    }
  }

  async getMetricsSnapshot(): Promise<MetricsSnapshot> {
    const now = Date.now();
    const aggregatedMetrics = await this.calculateAggregatedMetrics();
    const errorStats = this.errorTracker.getErrorStats();

    return {
      timestamp: now,
      current: {
        cpuUsage: aggregatedMetrics.cpuUsage,
        memoryUsage: aggregatedMetrics.memoryUsage,
        diskUsage: aggregatedMetrics.diskUsage,
        networkSent: aggregatedMetrics.networkStats.sent,
        networkReceived: aggregatedMetrics.networkStats.received,
        memoryAvailable: 0,
        processCount: aggregatedMetrics.processStats.count,
        threadCount: aggregatedMetrics.processStats.threadCount,
      },
      historical: {
        cpuUsage: this.cpuUsageData,
        memoryUsage: this.memoryUsageData,
        diskUsage: this.diskUsageData,
        networkTraffic: [],
      },
      alerts: this.alerts,
      latencyData: this.latencyData,
      errorData: this.errorTracker.getRecentErrors().map((error) => ({
        id: Math.random().toString(36).substr(2, 9),
        type: error.error.name || 'unknown',
        message: error.error.message,
        stack: error.componentStack || '',
        timestamp: error.timestamp,
        component:
          error.errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
        context: {},
      })),
      updateTimes: this.updateTimes,
      successRate: this.calculateSuccessRate(),
      timestamp: now,
    };
  }

  private calculateSuccessRate(): number[] {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const intervals = 12; // 5-minute intervals
    const intervalSize = 3600000 / intervals;

    return Array.from({ length: intervals }, (_, i) => {
      const intervalStart = hourAgo + i * intervalSize;
      const intervalEnd = intervalStart + intervalSize;

      const totalRequests = this.requestRateData.filter(
        (m) => m.timestamp >= intervalStart && m.timestamp < intervalEnd
      ).length;

      const errors = this.errorRateData.filter(
        (m) => m.timestamp >= intervalStart && m.timestamp < intervalEnd
      ).length;

      return totalRequests > 0
        ? ((totalRequests - errors) / totalRequests) * 100
        : 100;
    });
  }

  addMetric(
    type:
      | 'updateTime'
      | 'latency'
      | 'memory'
      | 'cpu'
      | 'error'
      | 'request'
      | 'disk'
      | 'memoryAvailable'
      | 'network'
      | 'process'
      | 'thread'
      | 'fps'
      | 'inputLatency'
      | 'syncLatency'
      | 'renderTime'
      | 'physicsTime'
      | 'assetLoad'
      | 'shaderCompile'
      | 'textureLoad'
      | 'modelLoad'
      | 'audioLoad',
    value: number
  ) {
    const metricData: MetricData = {
      timestamp: Date.now(),
      value,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      category: this.getMetricCategory(type),
    };

    const targetArray = this.getMetricArray(type);
    targetArray.push(metricData);

    // Cleanup old data
    this.cleanupOldData();

    this.emit('metricUpdated', type, metricData);
  }

  private getMetricCategory(
    type: string
  ): 'performance' | 'resources' | 'errors' | 'warnings' {
    switch (type) {
      case 'error':
        return 'errors';
      case 'updateTime':
      case 'latency':
      case 'request':
        return 'performance';
      case 'memory':
      case 'cpu':
        return 'resources';
      case 'disk':
        return 'resources';
      case 'memoryAvailable':
        return 'resources';
      case 'network':
        return 'performance';
      case 'process':
      case 'thread':
        return 'resources';
      case 'fps':
      case 'inputLatency':
      case 'syncLatency':
      case 'renderTime':
      case 'physicsTime':
        return 'performance';
      case 'assetLoad':
      case 'shaderCompile':
      case 'textureLoad':
      case 'modelLoad':
      case 'audioLoad':
        return 'performance';
      default:
        return 'performance';
    }
  }

  private getMetricArray(type: string): MetricData[] {
    switch (type) {
      case 'updateTime':
        return this.updateTimes;
      case 'latency':
        return this.latencyData;
      case 'memory':
        return this.memoryUsageData;
      case 'cpu':
        return this.cpuUsageData;
      case 'error':
        return this.errorRateData;
      case 'request':
        return this.requestRateData;
      case 'disk':
        return this.diskUsageData;
      case 'memoryAvailable':
        return this.memoryAvailableData;
      case 'network':
        return this.networkTrafficData;
      case 'process':
      case 'thread':
        return this.processStatsData;
      case 'fps':
        return this.fpsData;
      case 'inputLatency':
        return this.inputLatencyData;
      case 'syncLatency':
        return this.syncLatencyData;
      case 'renderTime':
        return this.renderTimeData;
      case 'physicsTime':
        return this.physicsTimeData;
      case 'assetLoad':
        return this.assetLoadTimeData;
      case 'shaderCompile':
        return this.shaderCompileTimeData;
      case 'textureLoad':
        return this.textureLoadTimeData;
      case 'modelLoad':
        return this.modelLoadTimeData;
      case 'audioLoad':
        return this.audioLoadTimeData;
      default:
        return this.updateTimes;
    }
  }

  private cleanupOldData(): void {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const cleanup = (arr: MetricData[]) =>
      arr.filter((m) => m.timestamp > dayAgo);

    this.updateTimes = cleanup(this.updateTimes);
    this.latencyData = cleanup(this.latencyData);
    this.memoryUsageData = cleanup(this.memoryUsageData);
    this.cpuUsageData = cleanup(this.cpuUsageData);
    this.errorRateData = cleanup(this.errorRateData);
    this.requestRateData = cleanup(this.requestRateData);
    this.diskUsageData = cleanup(this.diskUsageData);
    this.memoryAvailableData = cleanup(this.memoryAvailableData);
    this.networkTrafficData = cleanup(this.networkTrafficData);
    this.processStatsData = cleanup(this.processStatsData);
    this.fpsData = cleanup(this.fpsData);
    this.inputLatencyData = cleanup(this.inputLatencyData);
    this.syncLatencyData = cleanup(this.syncLatencyData);
    this.renderTimeData = cleanup(this.renderTimeData);
    this.physicsTimeData = cleanup(this.physicsTimeData);
    this.assetLoadTimeData = cleanup(this.assetLoadTimeData);
    this.shaderCompileTimeData = cleanup(this.shaderCompileTimeData);
    this.textureLoadTimeData = cleanup(this.textureLoadTimeData);
    this.modelLoadTimeData = cleanup(this.modelLoadTimeData);
    this.audioLoadTimeData = cleanup(this.audioLoadTimeData);
  }

  recordError(gameId: string, error: ErrorEvent) {
    this.initializeMetrics(gameId);
    const metrics = this.metrics.get(gameId)!;
    const history = this.errorHistory.get(gameId)!;

    const timestamp = Date.now();
    history.push({ timestamp, type: error.type });

    // Update counts
    if (error.severity === 'error') {
      metrics.errorCount++;
    } else if (error.severity === 'warning') {
      metrics.warningCount++;
    }

    // Update last error
    metrics.lastError = {
      timestamp,
      message: error.message,
    };

    // Calculate and check error rate
    const recentErrors = history.filter(
      (e) => e.timestamp > timestamp - this.RATE_WINDOW
    );
    const errorRate = recentErrors.length / (this.RATE_WINDOW / 60000);
    metrics.errorRate = errorRate;

    // Check error rate threshold
    this.checkErrorRateThreshold(errorRate);

    // Clean up old history
    this.errorHistory.set(
      gameId,
      history.filter((e) => e.timestamp > timestamp - this.RATE_WINDOW)
    );

    this.metrics.set(gameId, metrics);
    this.emit('metricsUpdated', gameId, { ...metrics });
    this.emit('error', error);

    // Create and emit an alert for critical errors
    if (error.severity === 'error') {
      const alert: Alert = {
        id: `alert-${Date.now()}`,
        timestamp: Date.now(),
        type: 'system',
        severity: 'critical',
        message: error.message,
        details: {
          errorType: error.type,
          playerId: error.playerId,
          ...error.details,
        },
      };
      this.alerts.push(alert);
      this.emit('alert', alert);
    }
  }

  getMetrics(gameId: string): GameMetrics {
    this.initializeMetrics(gameId);
    return { ...this.metrics.get(gameId)! };
  }

  clearMetrics(gameId: string) {
    this.metrics.delete(gameId);
    this.errorHistory.delete(gameId);
  }

  onMetricsUpdate(callback: (gameId: string, metrics: GameMetrics) => void) {
    this.on('metricsUpdated', callback);
    return () => this.off('metricsUpdated', callback);
  }

  subscribeToErrors(callback: (error: ErrorEvent) => void) {
    this.on('error', callback);
    return () => this.off('error', callback);
  }

  subscribeToAlerts(callback: (alert: Alert) => void) {
    this.on('alert', callback);
    return () => this.off('alert', callback);
  }

  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  acknowledgeAlert(alertId: string, userId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = Date.now();
      this.emit('alertUpdated', alert);
    }
  }

  addAlert(severity: 'error' | 'warning' | 'info', message: string): Alert {
    // Map the severity to the correct type
    let mappedSeverity: 'critical' | 'high' | 'medium' | 'low';
    switch (severity) {
      case 'error':
        mappedSeverity = 'critical';
        break;
      case 'warning':
        mappedSeverity = 'high';
        break;
      case 'info':
        mappedSeverity = 'medium';
        break;
      default:
        mappedSeverity = 'low';
    }

    const alert: Alert = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'system',
      severity: mappedSeverity,
      message,
      timestamp: Date.now(),
      acknowledged: false,
      details: {},
    };
    this.alerts.push(alert);
    this.emit('alert', alert);
    return alert;
  }

  monitorError(
    error: Error,
    details: {
      errorId: string;
      type: string;
      playerId?: string;
      gameId?: string;
    }
  ) {
    const errorEvent: ErrorEvent = {
      id: details.errorId,
      timestamp: Date.now(),
      type: details.type as 'validation' | 'connection' | 'system' | 'boundary',
      severity: 'error',
      message: error.message,
      playerId: details.playerId,
      details: {},
    };

    if (details.gameId) {
      this.recordError(details.gameId, errorEvent);
    }

    this.emit('error', errorEvent);
  }

  batchUpdate(updates: Record<string, MetricData[]>): void {
    Object.entries(updates).forEach(([type, dataPoints]) => {
      dataPoints.forEach((data) => {
        const metricType = type as
          | 'updateTime'
          | 'latency'
          | 'memory'
          | 'cpu'
          | 'error'
          | 'request'
          | 'disk'
          | 'memoryAvailable'
          | 'network'
          | 'process'
          | 'thread'
          | 'fps'
          | 'inputLatency'
          | 'syncLatency'
          | 'renderTime'
          | 'physicsTime'
          | 'assetLoad'
          | 'shaderCompile'
          | 'textureLoad'
          | 'modelLoad'
          | 'audioLoad';
        this.addMetric(metricType, data.value);
      });
    });
    this.emit('metricsUpdated', updates);
  }

  public async updateDiskUsage(): Promise<void> {
    const diskUsage = await this.calculateDiskUsage();
    this.addMetric('disk', diskUsage);
  }

  public startDiskMonitoring(interval: number = 60000): void {
    setInterval(() => {
      this.updateDiskUsage().catch((error) => {
        console.error('Failed to update disk usage:', error);
      });
    }, interval);
  }

  public async updateMemoryAvailable(): Promise<void> {
    const memoryAvailable = await this.calculateMemoryAvailable();
    this.addMetric('memoryAvailable', memoryAvailable);
  }

  public startMemoryMonitoring(interval: number = 30000): void {
    setInterval(() => {
      this.updateMemoryAvailable().catch((error) => {
        console.error('Failed to update memory available:', error);
      });
    }, interval);
  }

  public async updateNetworkStats(): Promise<void> {
    const stats = await this.calculateNetworkStats();
    const total = stats.sent + stats.received;
    this.addMetric('network', total);
  }

  public async updateProcessStats(): Promise<void> {
    const stats = await this.calculateProcessStats();
    this.addMetric('process', stats.count);
    this.addMetric('thread', stats.threadCount);
  }

  public startNetworkMonitoring(interval: number = 10000): void {
    setInterval(() => {
      this.updateNetworkStats().catch((error) => {
        console.error('Failed to update network stats:', error);
      });
    }, interval);
  }

  public startProcessMonitoring(interval: number = 30000): void {
    setInterval(() => {
      this.updateProcessStats().catch((error) => {
        console.error('Failed to update process stats:', error);
      });
    }, interval);
  }

  public updateGameMetrics(metrics: {
    fps?: number;
    inputLatency?: number;
    syncLatency?: number;
    renderTime?: number;
    physicsTime?: number;
  }): void {
    const timestamp = Date.now();

    if (metrics.fps !== undefined) {
      this.addMetric('fps', metrics.fps);
    }
    if (metrics.inputLatency !== undefined) {
      this.addMetric('inputLatency', metrics.inputLatency);
    }
    if (metrics.syncLatency !== undefined) {
      this.addMetric('syncLatency', metrics.syncLatency);
    }
    if (metrics.renderTime !== undefined) {
      this.addMetric('renderTime', metrics.renderTime);
    }
    if (metrics.physicsTime !== undefined) {
      this.addMetric('physicsTime', metrics.physicsTime);
    }

    // Check thresholds for game metrics
    this.checkGameThresholds({
      fps: metrics.fps ?? this.getLastValue(this.fpsData),
      inputLatency:
        metrics.inputLatency ?? this.getLastValue(this.inputLatencyData),
      syncLatency:
        metrics.syncLatency ?? this.getLastValue(this.syncLatencyData),
      renderTime: metrics.renderTime ?? this.getLastValue(this.renderTimeData),
      physicsTime:
        metrics.physicsTime ?? this.getLastValue(this.physicsTimeData),
    });
  }

  public recordClueCompletion(playerId: string, progress: number): void {
    // Track player progress for clue completion
    const playerMetrics = this.metrics.get(playerId) || {
      errorCount: 0,
      warningCount: 0,
      errorRate: 0,
    };

    // Update player metrics (placeholder for now)
    this.metrics.set(playerId, playerMetrics);

    // Emit event for clue completion tracking
    this.emit('clueCompleted', { playerId, progress, timestamp: Date.now() });
  }

  public recordPlayerJoin(playerId: string, gameId: string): void {
    // Track player joining a game
    const playerMetrics = this.metrics.get(playerId) || {
      errorCount: 0,
      warningCount: 0,
      errorRate: 0,
    };

    // Update player metrics
    this.metrics.set(playerId, playerMetrics);

    // Emit event for player join tracking
    this.emit('playerJoined', { playerId, gameId, timestamp: Date.now() });
  }

  public recordGameCompletion(
    playerId: string,
    progress: number,
    sessionDuration: number
  ): void {
    // Track game completion
    const playerMetrics = this.metrics.get(playerId) || {
      errorCount: 0,
      warningCount: 0,
      errorRate: 0,
    };

    // Update player metrics
    this.metrics.set(playerId, playerMetrics);

    // Emit event for game completion tracking
    this.emit('gameCompleted', {
      playerId,
      progress,
      sessionDuration,
      timestamp: Date.now(),
    });
  }

  public recordPlayerLeave(
    playerId: string,
    completedClues?: number,
    sessionDuration?: number
  ): void {
    // Track player leaving a game session
    const playerMetrics = this.metrics.get(playerId) || {
      errorCount: 0,
      warningCount: 0,
      errorRate: 0,
    };

    // Update player metrics (placeholder for extensibility)
    this.metrics.set(playerId, playerMetrics);

    // Emit event for player leave tracking
    this.emit('playerLeft', {
      playerId,
      completedClues: completedClues ?? 0,
      sessionDuration: sessionDuration ?? 0,
      timestamp: Date.now(),
    });
  }

  private getLastValue(data: MetricData[]): number {
    return data.length > 0 ? data[data.length - 1].value : 0;
  }

  public startGameMetricsMonitoring(): void {
    // Monitor FPS using requestAnimationFrame
    let lastFrameTime = performance.now();
    let frameCount = 0;
    const measureFPS = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastFrameTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
        this.addMetric('fps', fps);
        frameCount = 0;
        lastFrameTime = now;
      }

      requestAnimationFrame(measureFPS);
    };
    requestAnimationFrame(measureFPS);

    // Start other game metrics monitoring
    this.startInputLatencyMonitoring();
  }

  private startInputLatencyMonitoring(): void {
    const measureInputLatency = (event: Event) => {
      const latency = performance.now() - event.timeStamp;
      this.addMetric('inputLatency', latency);
    };

    // Monitor input events
    ['mousedown', 'keydown', 'touchstart'].forEach((eventType) => {
      window.addEventListener(eventType, measureInputLatency, {
        passive: true,
      });
    });
  }

  public updateAssetMetrics(metrics: {
    assetLoad?: number;
    shaderCompile?: number;
    textureLoad?: number;
    modelLoad?: number;
    audioLoad?: number;
  }): void {
    if (metrics.assetLoad !== undefined) {
      this.addMetric('assetLoad', metrics.assetLoad);
    }
    if (metrics.shaderCompile !== undefined) {
      this.addMetric('shaderCompile', metrics.shaderCompile);
    }
    if (metrics.textureLoad !== undefined) {
      this.addMetric('textureLoad', metrics.textureLoad);
    }
    if (metrics.modelLoad !== undefined) {
      this.addMetric('modelLoad', metrics.modelLoad);
    }
    if (metrics.audioLoad !== undefined) {
      this.addMetric('audioLoad', metrics.audioLoad);
    }

    this.checkAssetThresholds(metrics);
  }

  public startAssetMonitoring(): void {
    // Monitor resource loading times
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const url = entry.name;
        const duration = entry.duration;

        // Categorize the resource based on its extension or type
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          this.updateAssetMetrics({ textureLoad: duration });
        } else if (url.match(/\.(gltf|glb|obj|fbx)$/i)) {
          this.updateAssetMetrics({ modelLoad: duration });
        } else if (url.match(/\.(mp3|wav|ogg)$/i)) {
          this.updateAssetMetrics({ audioLoad: duration });
        } else if (url.match(/\.(glsl|vert|frag)$/i)) {
          this.updateAssetMetrics({ shaderCompile: duration });
        } else {
          this.updateAssetMetrics({ assetLoad: duration });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }
}

export const gameMetricsMonitor = GameMetricsMonitor.getInstance();
