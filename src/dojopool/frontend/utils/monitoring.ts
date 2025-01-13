import { MONITORING_CONFIG } from '../../constants';
import { Cache } from './cache';

interface MetricValue {
  value: number;
  timestamp: number;
}

interface MetricWindow {
  values: MetricValue[];
  sum: number;
  count: number;
}

interface ErrorContext {
  component?: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

interface ErrorStats {
  total: number;
  byComponent: Map<string, number>;
  recentErrors: { error: Error; context: ErrorContext }[];
  errorRates: { [key: string]: number };
}

export class GameMetricsMonitor {
  private metrics: Map<string, MetricWindow> = new Map();
  private readonly metricsWindow = MONITORING_CONFIG.METRICS_WINDOW;
  private readonly updateInterval = MONITORING_CONFIG.UPDATE_INTERVAL;
  private readonly maxErrors = MONITORING_CONFIG.MAX_ERRORS;
  private readonly maxIncidents = MONITORING_CONFIG.MAX_INCIDENTS;
  private readonly cache: Cache<Record<string, number>>;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.cache = new Cache();
    this.startPeriodicUpdate();
  }

  recordMetric(name: string, value: number): void {
    const now = Date.now();
    let window = this.metrics.get(name);

    if (!window) {
      window = { values: [], sum: 0, count: 0 };
      this.metrics.set(name, window);
    }

    // Remove old values
    window.values = window.values.filter((v) => now - v.timestamp <= this.metricsWindow);
    window.sum = window.values.reduce((sum, v) => sum + v.value, 0);
    window.count = window.values.length;

    // Add new value
    window.values.push({ value, timestamp: now });
    window.sum += value;
    window.count++;

    // Trim if needed
    if (window.values.length > this.maxErrors) {
      const removed = window.values.shift()!;
      window.sum -= removed.value;
      window.count--;
    }
  }

  getMetric(name: string): number {
    const window = this.metrics.get(name);
    if (!window || window.count === 0) return 0;
    return window.sum / window.count;
  }

  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, window] of this.metrics.entries()) {
      result[name] = window.sum / window.count;
    }
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  private startPeriodicUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      const metrics = this.getMetrics();
      this.cache.set('metrics', metrics);
    }, this.updateInterval);
  }

  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.cache.destroy();
  }
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Map<string, { error: Error; context: ErrorContext }[]> = new Map();
  private errorStats: ErrorStats = {
    total: 0,
    byComponent: new Map(),
    recentErrors: [],
    errorRates: {},
  };

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  trackError(error: Error, context: ErrorContext): void {
    const { component = 'unknown' } = context;

    if (!this.errors.has(component)) {
      this.errors.set(component, []);
    }

    const componentErrors = this.errors.get(component)!;
    componentErrors.push({ error, context });

    // Update stats
    this.errorStats.total++;
    this.errorStats.byComponent.set(
      component,
      (this.errorStats.byComponent.get(component) || 0) + 1
    );

    // Add to recent errors
    this.errorStats.recentErrors.push({ error, context });
    if (this.errorStats.recentErrors.length > MONITORING_CONFIG.MAX_ERRORS) {
      this.errorStats.recentErrors.shift();
    }

    // Update error rates
    this.updateErrorRates();
  }

  getErrorStats(): ErrorStats {
    return this.errorStats;
  }

  clearErrors(): void {
    this.errors.clear();
    this.errorStats = {
      total: 0,
      byComponent: new Map(),
      recentErrors: [],
      errorRates: {},
    };
  }

  private updateErrorRates(): void {
    const now = Date.now();
    const hourAgo = now - 3600000; // 1 hour ago

    // Calculate error rates per component
    for (const [component, errors] of this.errors.entries()) {
      const recentErrors = errors.filter(({ context }) => context.timestamp > hourAgo);
      this.errorStats.errorRates[component] = (recentErrors.length / 3600) * 1000; // errors per hour
    }
  }
}

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: { message: string; timestamp: number; level: string }[] = [];
  private readonly maxLogs = MONITORING_CONFIG.MAX_ERRORS;

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    this.logs.push({
      message,
      timestamp: Date.now(),
      level,
    });

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): { message: string; timestamp: number; level: string }[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export class RetryMechanism {
  private static instance: RetryMechanism;
  private readonly maxRetries = MONITORING_CONFIG.RATE_LIMIT.MAX_REQUESTS;
  private readonly retryDelay = 1000; // 1 second

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): RetryMechanism {
    if (!RetryMechanism.instance) {
      RetryMechanism.instance = new RetryMechanism();
    }
    return RetryMechanism.instance;
  }

  async retry<T>(operation: () => Promise<T>, maxAttempts = this.maxRetries): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxAttempts) break;

        await this.delay(this.retryDelay * attempt);
      }
    }

    throw lastError || new Error('Operation failed after maximum retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
