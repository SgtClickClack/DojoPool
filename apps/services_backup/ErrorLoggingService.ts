interface ErrorContext {
  componentStack?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  [key: string]: any;
}

interface ErrorLog {
  error: Error;
  context: ErrorContext;
  timestamp: number;
  id: string;
}

class ErrorLoggingService {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  logError(error: Error, context: ErrorContext = {}): void {
    const errorLog: ErrorLog = {
      error,
      context: {
        ...context,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      id: this.generateId(),
    };

    this.logs.push(errorLog);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // TODO: Send to external logging service in production
    // this.sendToExternalService(errorLog);
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async sendToExternalService(errorLog: ErrorLog): Promise<void> {
    // TODO: Implement external logging service integration
    // Example: Sentry, LogRocket, etc.
    try {
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog),
      // });
    } catch (err) {
      console.error('Failed to send error to external service:', err);
    }
  }
}

// Create singleton instance
const errorLoggingService = new ErrorLoggingService();

// Export the logError function for direct use
export const logError = (error: Error, context: ErrorContext = {}): void => {
  errorLoggingService.logError(error, context);
};

export default errorLoggingService;
