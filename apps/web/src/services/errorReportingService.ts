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

import logger from './loggerService';

class ErrorReportingService {
  private baseUrl: string;
  private retryQueue: ErrorReport[] = [];
  private isOnline: boolean = true;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';

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
      logger.error('Failed to report error', {
        error: error instanceof Error ? error.message : String(error),
      });

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
        componentStack: errorInfo.componentStack,
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
      this.reportJavaScriptError(
        new Error(`Unhandled promise rejection: ${event.reason}`),
        {
          reason: event.reason,
          promise: event.promise,
        }
      );
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportJavaScriptError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
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
            if ('value' in entry && (entry as any).value > 0.1) {
              // Layout shifts > 10%
              this.reportPerformanceIssue(
                'layout-shift',
                (entry as any).value,
                0.1,
                {
                  sources: (entry as any).sources,
                }
              );
            }
          }
        });

        layoutObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        logger.warn('Performance monitoring setup failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

// Export singleton instance
export const errorReportingService = new ErrorReportingService();
export default errorReportingService;
