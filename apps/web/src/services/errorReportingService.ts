export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
  viewport: {
    width: number;
    height: number;
  };
  userId?: string | null;
  sessionId?: string | null;
  additionalData?: Record<string, any>;
}

export interface ErrorReportResponse {
  success: boolean;
  reportId?: string;
  error?: string;
}

class ErrorReportingService {
  private baseUrl: string;
  private retryQueue: ErrorReport[] = [];
  private isOnline: boolean = true;

  constructor() {
    const rawEnv = process.env.NEXT_PUBLIC_API_URL;
    const envBase = rawEnv ? rawEnv.trim().replace(/\/$/, '') : undefined;
    // Normalize: use Next.js rewrite '/api' by default.
    // If an absolute URL is provided and misses '/api/v1', append it.
    if (!envBase) {
      this.baseUrl = '/api';
    } else if (/^https?:\/\//i.test(envBase)) {
      if (/\/api\/v1$/i.test(envBase)) {
        this.baseUrl = envBase;
      } else if (/\/api$/i.test(envBase)) {
        this.baseUrl = `${envBase}/v1`;
      } else {
        this.baseUrl = `${envBase}/api/v1`;
      }
    } else {
      this.baseUrl = '/api';
    }

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processRetryQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  // Safely convert arbitrary values to short strings for messages
  private safeToString(value: unknown): string {
    try {
      if (value instanceof Error) {
        return `${value.name}: ${value.message}`;
      }
      if (typeof value === 'bigint') {
        return value.toString();
      }
      if (typeof value === 'function') {
        return '[Function]';
      }
      if (typeof value === 'symbol') {
        return value.toString();
      }
      if (typeof value === 'object') {
        return '[Object]';
      }
      return String(value);
    } catch {
      return '[Unserializable]';
    }
  }

  // Safely serialize arbitrary structures (handles BigInt, circular refs, Promises, Errors)
  private safeSerialize<T = any>(value: T, maxDepth: number = 3): any {
    const seen = new WeakSet<object>();

    const helper = (val: any, depth: number): any => {
      if (depth > maxDepth) return '[MaxDepth]';
      const t = typeof val;
      if (val === null || t === 'undefined') return val;
      if (t === 'string' || t === 'number' || t === 'boolean') return val;
      if (t === 'bigint') return val.toString();
      if (t === 'symbol') return val.toString();
      if (t === 'function') return '[Function]';
      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack,
        };
      }
      if (typeof Promise !== 'undefined' && val instanceof Promise) {
        return '[Promise]';
      }
      if (Array.isArray(val)) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
        return val.map((item) => helper(item, depth + 1));
      }
      if (t === 'object') {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
        const out: Record<string, any> = {};
        for (const key of Object.keys(val)) {
          try {
            out[key] = helper((val as any)[key], depth + 1);
          } catch {
            out[key] = '[Unserializable]';
          }
        }
        return out;
      }
      return '[Unknown]';
    };

    return helper(value, 0);
  }

  /**
   * Report an error to the backend
   */
  async reportError(errorReport: ErrorReport): Promise<ErrorReportResponse> {
    try {
      if (!this.isOnline) {
        // Queue for later when back online
        this.retryQueue.push(errorReport);
        return {
          success: false,
          error: 'Offline - error queued for retry',
        };
      }

      // Ensure additionalData is JSON-safe
      if (errorReport.additionalData) {
        errorReport.additionalData = this.safeSerialize(
          errorReport.additionalData
        );
      }

      const response = await fetch(`${this.baseUrl}/errors/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to report error:', error);

      // Queue for retry if it's a network error
      if (!navigator.onLine || error instanceof TypeError) {
        this.retryQueue.push(errorReport);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Report a React error with component stack
   */
  async reportReactError(
    error: Error,
    errorInfo: React.ErrorInfo,
    additionalData?: Record<string, any>
  ): Promise<ErrorReportResponse> {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      errorId: `react_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      additionalData: {
        componentStack: errorInfo.componentStack || undefined,
        ...additionalData,
      },
    };

    return this.reportError(errorReport);
  }

  /**
   * Report a generic JavaScript error
   */
  async reportJavaScriptError(
    error: Error,
    additionalData?: Record<string, any>
  ): Promise<ErrorReportResponse> {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      errorId: `js_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      additionalData,
    };

    return this.reportError(errorReport);
  }

  /**
   * Report a performance issue
   */
  async reportPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    additionalData?: Record<string, any>
  ): Promise<ErrorReportResponse> {
    const errorReport: ErrorReport = {
      message: `Performance issue: ${metric} exceeded threshold`,
      errorId: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      additionalData: {
        metric,
        value,
        threshold,
        ...additionalData,
      },
    };

    return this.reportError(errorReport);
  }

  /**
   * Process queued error reports when back online
   */
  private async processRetryQueue(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    const queueCopy = [...this.retryQueue];
    this.retryQueue = [];

    for (const errorReport of queueCopy) {
      try {
        await this.reportError(errorReport);
      } catch (error) {
        // If still failing, add back to queue
        this.retryQueue.push(errorReport);
        break; // Stop processing if one fails
      }
    }
  }

  /**
   * Get current user ID from localStorage
   */
  private getUserId(): string | null {
    try {
      return (
        localStorage.getItem('user_id') ||
        localStorage.getItem('auth_user_id') ||
        null
      );
    } catch {
      return null;
    }
  }

  /**
   * Get current session ID
   */
  private getSessionId(): string | null {
    try {
      return (
        sessionStorage.getItem('session_id') ||
        localStorage.getItem('session_id') ||
        null
      );
    } catch {
      return null;
    }
  }

  /**
   * Get error queue length
   */
  getQueueLength(): number {
    return this.retryQueue.length;
  }

  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.retryQueue = [];
  }

  /**
   * Set up global error handlers
   */
  setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      try {
        const reasonSummary = this.safeToString((event as any).reason);
        const reasonSerialized = this.safeSerialize((event as any).reason);
        this.reportJavaScriptError(
          new Error(`Unhandled promise rejection: ${reasonSummary}`),
          {
            reason: reasonSerialized,
            // Avoid attaching raw Promise which is not serializable and may create cycles
            // promise: '[Promise]'
          }
        );
      } catch (handlerError) {
        // Last-resort logging; do not throw from handler
        // eslint-disable-next-line no-console
        console.error('Unhandledrejection handler failed:', handlerError);
      }
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      try {
        this.reportJavaScriptError(new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: this.safeSerialize(event.error),
        });
      } catch (handlerError) {
        // eslint-disable-next-line no-console
        console.error('Global error handler failed:', handlerError);
      }
    });

    // Handle performance issues
    if ('PerformanceObserver' in window) {
      try {
        // Monitor long tasks
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) {
              // Tasks longer than 100ms
              this.reportPerformanceIssue('long-task', entry.duration, 100, {
                entryType: entry.entryType,
                startTime: entry.startTime,
              });
            }
          }
        });

        observer.observe({ entryTypes: ['longtask'] });

        // Monitor large layout shifts
        const layoutObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutEntry = entry as any; // LayoutShiftEntry type
            if (layoutEntry.value > 0.1) {
              // Layout shifts > 10%
              this.reportPerformanceIssue(
                'layout-shift',
                layoutEntry.value,
                0.1,
                {
                  sources: layoutEntry.sources,
                }
              );
            }
          }
        });

        layoutObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }
  }
}

// Export singleton instance
export const errorReportingService = new ErrorReportingService();
export default errorReportingService;
