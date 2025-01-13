import { AuditLogger } from './auditLogger';
import { RetryMechanism } from './retryMechanism';

interface ErrorContext {
  timestamp: number;
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  byComponent: Record<string, number>;
  recentErrors: Array<{
    error: Error;
    context: ErrorContext;
    timestamp: number;
  }>;
}

interface ErrorTrackerConfig {
  maxRecentErrors: number;
  retryOptions: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
  groupingSimilarErrors: boolean;
  errorThresholds: {
    warning: number;
    critical: number;
  };
}

const DEFAULT_CONFIG: ErrorTrackerConfig = {
  maxRecentErrors: 100,
  retryOptions: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  },
  groupingSimilarErrors: true,
  errorThresholds: {
    warning: 10,
    critical: 50,
  },
};

export class ErrorTracker {
  private static instance: ErrorTracker;
  private config: ErrorTrackerConfig;
  private stats: ErrorStats;
  private auditLogger: AuditLogger;
  private retryMechanism: RetryMechanism;
  private errorHandlers: Set<(error: Error, context: ErrorContext) => void>;
  private errorGroups: Map<
    string,
    {
      count: number;
      firstSeen: number;
      lastSeen: number;
      examples: Array<{ error: Error; context: ErrorContext }>;
    }
  >;

  private constructor(config: Partial<ErrorTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      total: 0,
      byType: {},
      byComponent: {},
      recentErrors: [],
    };
    this.auditLogger = AuditLogger.getInstance();
    this.retryMechanism = RetryMechanism.getInstance();
    this.errorHandlers = new Set();
    this.errorGroups = new Map();
  }

  static getInstance(config?: Partial<ErrorTrackerConfig>): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker(config);
    }
    return ErrorTracker.instance;
  }

  private getErrorFingerprint(error: Error): string {
    return `${error.name}:${error.message}:${error.stack?.split('\n')[1] || ''}`;
  }

  private updateErrorStats(error: Error, context: ErrorContext): void {
    this.stats.total++;
    this.stats.byType[error.name] = (this.stats.byType[error.name] || 0) + 1;

    if (context.component) {
      this.stats.byComponent[context.component] =
        (this.stats.byComponent[context.component] || 0) + 1;
    }

    this.stats.recentErrors.unshift({
      error,
      context,
      timestamp: Date.now(),
    });

    if (this.stats.recentErrors.length > this.config.maxRecentErrors) {
      this.stats.recentErrors.pop();
    }

    if (this.config.groupingSimilarErrors) {
      const fingerprint = this.getErrorFingerprint(error);
      const group = this.errorGroups.get(fingerprint) || {
        count: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        examples: [],
      };

      group.count++;
      group.lastSeen = Date.now();
      if (group.examples.length < 5) {
        group.examples.push({ error, context });
      }

      this.errorGroups.set(fingerprint, group);
    }

    // Check error thresholds
    const componentErrors = context.component ? this.stats.byComponent[context.component] : 0;

    if (componentErrors >= this.config.errorThresholds.critical) {
      this.auditLogger.logError(
        'ERROR_THRESHOLD',
        'monitor',
        'error_tracker',
        new Error(`Critical error threshold reached for component ${context.component}`)
      );
    } else if (componentErrors >= this.config.errorThresholds.warning) {
      this.auditLogger.logError(
        'ERROR_THRESHOLD',
        'monitor',
        'error_tracker',
        new Error(`Warning error threshold reached for component ${context.component}`)
      );
    }
  }

  async trackError(error: Error, context: Partial<ErrorContext> = {}): Promise<void> {
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      ...context,
    };

    this.updateErrorStats(error, fullContext);

    // Notify error handlers
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error, fullContext);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });

    // Log error
    await this.auditLogger.logError(
      'ERROR_TRACKED',
      context.action || 'unknown',
      context.component || 'unknown',
      error,
      {
        userId: context.userId,
        metadata: context.metadata,
      }
    );
  }

  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    try {
      return await this.retryMechanism.executeWithRetry(operation, this.config.retryOptions);
    } catch (error) {
      await this.trackError(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    }
  }

  onError(handler: (error: Error, context: ErrorContext) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  getErrorStats(): ErrorStats {
    return { ...this.stats };
  }

  getErrorGroups(): Array<{
    fingerprint: string;
    count: number;
    firstSeen: number;
    lastSeen: number;
    examples: Array<{ error: Error; context: ErrorContext }>;
  }> {
    return Array.from(this.errorGroups.entries()).map(([fingerprint, group]) => ({
      fingerprint,
      ...group,
    }));
  }

  clearStats(): void {
    this.stats = {
      total: 0,
      byType: {},
      byComponent: {},
      recentErrors: [],
    };
    this.errorGroups.clear();
  }

  getErrorRate(component?: string, timeWindow: number = 3600000): number {
    const now = Date.now();
    const recentErrors = this.stats.recentErrors.filter(
      (error) =>
        now - error.timestamp <= timeWindow && (!component || error.context.component === component)
    );

    return (recentErrors.length / timeWindow) * 3600000; // Errors per hour
  }

  async analyzeErrorTrends(): Promise<{
    topErrorTypes: Array<{ type: string; count: number }>;
    topComponents: Array<{ component: string; count: number }>;
    errorRates: Array<{ component: string; rate: number }>;
    recentTrends: Array<{
      timestamp: number;
      errorCount: number;
    }>;
  }> {
    const topErrorTypes = Object.entries(this.stats.byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topComponents = Object.entries(this.stats.byComponent)
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const errorRates = Object.keys(this.stats.byComponent).map((component) => ({
      component,
      rate: this.getErrorRate(component),
    }));

    // Calculate error trends in 1-hour intervals
    const hourlyTrends = new Map<number, number>();
    const now = Date.now();
    const hourInMs = 3600000;

    this.stats.recentErrors.forEach(({ timestamp }) => {
      const hourBucket = Math.floor(timestamp / hourInMs) * hourInMs;
      hourlyTrends.set(hourBucket, (hourlyTrends.get(hourBucket) || 0) + 1);
    });

    const recentTrends = Array.from(hourlyTrends.entries())
      .map(([timestamp, count]) => ({ timestamp, errorCount: count }))
      .sort((a, b) => b.timestamp - a.timestamp);

    return {
      topErrorTypes,
      topComponents,
      errorRates,
      recentTrends,
    };
  }
}
