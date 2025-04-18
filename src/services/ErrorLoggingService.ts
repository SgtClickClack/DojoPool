import { ErrorInfo } from "react";

interface ErrorLog {
  timestamp: string;
  error: Error;
  errorInfo?: ErrorInfo;
  context?: Record<string, unknown>;
}

class ErrorLoggingService {
  private static instance: ErrorLoggingService;
  private logs: ErrorLog[] = [];
  private readonly maxLogs = 100;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  public log(
    error: Error,
    errorInfo?: ErrorInfo,
    context?: Record<string, unknown>,
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      error,
      errorInfo,
      context,
    };

    // Add to local logs
    this.logs.unshift(errorLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error logged:", errorLog);
    }

    // Send to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      this.sendToErrorTrackingService(errorLog);
    }
  }

  public getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  private async sendToErrorTrackingService(errorLog: ErrorLog): Promise<void> {
    try {
      const response = await fetch("/api/error-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorLog),
      });

      if (!response.ok) {
        console.error(
          "Failed to send error to tracking service:",
          response.statusText,
        );
      }
    } catch (err) {
      console.error("Error sending to tracking service:", err);
    }
  }
}

// Export singleton instance
const errorLoggingService = ErrorLoggingService.getInstance();

// Export helper function for easy logging
export const logError = (
  error: Error,
  errorInfo?: ErrorInfo,
  context?: Record<string, unknown>,
): void => {
  errorLoggingService.log(error, errorInfo, context);
};

export default errorLoggingService;
