/**
 * Centralized logging utility for DojoPool application
 * Replaces console.log statements with structured logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private context: string;
  private isDevelopment: boolean;

  private constructor(context = 'DojoPool', logLevel = LogLevel.INFO) {
    this.context = context;
    this.logLevel = logLevel;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(context?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context);
    }
    return Logger.instance;
  }

  /**
   * Create a new logger instance with specific context
   */
  public static createLogger(context: string): Logger {
    return new Logger(context);
  }

  /**
   * Set the minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log debug information (development only)
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, metadata);
    }
  }

  /**
   * Log general information
   */
  public info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, metadata);
    }
  }

  /**
   * Log warnings
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, metadata);
    }
  }

  /**
   * Log errors
   */
  public error(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(LogLevel.ERROR, message, metadata, error);
    }
  }

  /**
   * Log performance metrics
   */
  public performance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  /**
   * Log API requests
   */
  public apiRequest(method: string, url: string, duration?: number, status?: number): void {
    this.info(`API: ${method} ${url}`, {
      method,
      url,
      duration: duration ? `${duration}ms` : undefined,
      status,
    });
  }

  /**
   * Log user actions
   */
  public userAction(action: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`User Action: ${action}`, {
      userId,
      action,
      ...metadata,
    });
  }

  /**
   * Log security events
   */
  public security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>): void {
    this.warn(`Security: ${event}`, {
      severity,
      event,
      ...metadata,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context: this.context,
      metadata,
      error,
    };

    // In development, use console for immediate feedback
    if (this.isDevelopment) {
      this.logToConsole(level, entry);
    }

    // In production, send to logging service
    this.logToService(entry);
  }

  private logToConsole(level: LogLevel, entry: LogEntry): void {
    const formattedMessage = `[${entry.timestamp}] ${entry.level} [${entry.context}]: ${entry.message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.metadata);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.error || entry.metadata);
        break;
    }
  }

  private logToService(entry: LogEntry): void {
    const payload = JSON.stringify(entry);

    if (typeof window !== 'undefined') {
      try {
        if (navigator && typeof navigator.sendBeacon === 'function') {
          const beaconUrl = (window as any).__LOG_ENDPOINT__ || '/api/logs';
          const blob = new Blob([payload], { type: 'application/json' });
          const sent = navigator.sendBeacon(beaconUrl, blob);
          if (sent) return;
        }

        const fetchUrl = (window as any).__LOG_ENDPOINT__ || '/api/logs';
        void fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // ignore and fallback to localStorage
        });
      } catch {
        // ignore and fallback
      }

      try {
        const logs = JSON.parse(localStorage.getItem('dojopool_logs') || '[]');
        logs.push(entry);
        if (logs.length > 1000) logs.splice(0, logs.length - 1000);
        localStorage.setItem('dojopool_logs', JSON.stringify(logs));
        return;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to buffer log entry:', err);
      }
    }

    try {
      // eslint-disable-next-line no-console
      console.log(`[log] ${payload}`);
    } catch {
      // no-op
    }
  }

  /**
   * Get all stored logs (for debugging)
   */
  public getLogs(): LogEntry[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return JSON.parse(localStorage.getItem('dojopool_logs') || '[]');
      } catch (error) {
        this.error('Failed to retrieve logs', error as Error);
        return [];
      }
    }
    return [];
  }

  /**
   * Clear all stored logs
   */
  public clearLogs(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('dojopool_logs');
    }
  }

  /**
   * Create a timer for performance measurement
   */
  public startTimer(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.performance(label, Math.round(duration));
      return duration;
    };
  }
}

// Create default logger instance
export const logger = Logger.getInstance();

// Export logger creators for specific contexts
export const createAPILogger = () => Logger.createLogger('API');
export const createUILogger = () => Logger.createLogger('UI');
export const createGameLogger = () => Logger.createLogger('Game');
export const createAILogger = () => Logger.createLogger('AI');
export const createSecurityLogger = () => Logger.createLogger('Security');

export default Logger;