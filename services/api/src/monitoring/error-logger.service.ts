import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as winston from 'winston';

export interface ErrorLogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: Error;
  context?: Record<string, any>;
  tags?: Record<string, string>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp?: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByCode: Record<string, number>;
  errorsByPath: Record<string, number>;
  recentErrors: ErrorLogEntry[];
  topErrorMessages: Array<{ message: string; count: number }>;
}

@Injectable()
export class ErrorLoggerService {
  private readonly logger: winston.Logger;
  private readonly consoleLogger = new Logger(ErrorLoggerService.name);
  private errorMetrics: ErrorMetrics;

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.errorMetrics = this.initializeMetrics();
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const get = this.configService?.get.bind(this.configService) as
      | (<T = any>(key: string) => T | undefined)
      | undefined;
    const isProduction = (get?.<string>('NODE_ENV') as string) === 'production';
    const logLevel = (get?.<string>('LOG_LEVEL') as string) || 'info';
    const logDir = (get?.<string>('LOG_DIR') as string) || 'logs';

    const transports: winston.transport[] = [
      // Console transport for development
      new winston.transports.Console({
        level: logLevel,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? JSON.stringify(meta, null, 2)
              : '';
            return `${timestamp} [${level}]: ${message}${metaStr ? '\n' + metaStr : ''}`;
          })
        ),
      }),
    ];

    // File transports for production
    if (isProduction) {
      transports.push(
        // Error log file
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        }),

        // Combined log file
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        })
      );
    }

    return winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'exceptions.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'rejections.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        }),
      ],
    });
  }

  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByLevel: {},
      errorsByCode: {},
      errorsByPath: {},
      recentErrors: [],
      topErrorMessages: [],
    };
  }

  /**
   * Log an error with structured data
   */
  logError(entry: ErrorLogEntry): void {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level,
      message: entry.message,
      ...entry.context,
      tags: entry.tags,
    };

    // Log to Winston
    this.logger.log(entry.level, entry.message, logEntry);

    // Also log to console for immediate visibility
    if (entry.level === 'error') {
      this.consoleLogger.error(
        `[${entry.level.toUpperCase()}] ${entry.message}`,
        {
          error: entry.error,
          context: entry.context,
          tags: entry.tags,
        }
      );
    } else {
      this.consoleLogger.warn(
        `[${entry.level.toUpperCase()}] ${entry.message}`,
        {
          context: entry.context,
          tags: entry.tags,
        }
      );
    }

    // Update metrics
    this.updateMetrics(entry);
  }

  /**
   * Log an info message
   */
  logInfo(
    message: string,
    context?: Record<string, any>,
    tags?: Record<string, string>
  ): void {
    this.logError({
      level: 'info',
      message,
      context,
      tags,
    });
  }

  /**
   * Log a warning
   */
  logWarn(
    message: string,
    context?: Record<string, any>,
    tags?: Record<string, string>
  ): void {
    this.logError({
      level: 'warn',
      message,
      context,
      tags,
    });
  }

  /**
   * Log a debug message
   */
  logDebug(
    message: string,
    context?: Record<string, any>,
    tags?: Record<string, string>
  ): void {
    this.logError({
      level: 'debug',
      message,
      context,
      tags,
    });
  }

  /**
   * Update error metrics
   */
  private updateMetrics(entry: ErrorLogEntry): void {
    this.errorMetrics.totalErrors++;

    // Count by level
    this.errorMetrics.errorsByLevel[entry.level] =
      (this.errorMetrics.errorsByLevel[entry.level] || 0) + 1;

    // Count by error code
    if (entry.tags?.errorCode) {
      this.errorMetrics.errorsByCode[entry.tags.errorCode] =
        (this.errorMetrics.errorsByCode[entry.tags.errorCode] || 0) + 1;
    }

    // Count by path
    if (entry.tags?.path) {
      this.errorMetrics.errorsByPath[entry.tags.path] =
        (this.errorMetrics.errorsByPath[entry.tags.path] || 0) + 1;
    }

    // Keep recent errors (last 100)
    this.errorMetrics.recentErrors.unshift(entry);
    if (this.errorMetrics.recentErrors.length > 100) {
      this.errorMetrics.recentErrors.pop();
    }

    // Update top error messages
    this.updateTopErrorMessages(entry.message);
  }

  private updateTopErrorMessages(message: string): void {
    const existingIndex = this.errorMetrics.topErrorMessages.findIndex(
      (item) => item.message === message
    );

    if (existingIndex >= 0) {
      this.errorMetrics.topErrorMessages[existingIndex].count++;
    } else {
      this.errorMetrics.topErrorMessages.push({ message, count: 1 });
    }

    // Sort by count and keep top 10
    this.errorMetrics.topErrorMessages.sort((a, b) => b.count - a.count);
    if (this.errorMetrics.topErrorMessages.length > 10) {
      this.errorMetrics.topErrorMessages =
        this.errorMetrics.topErrorMessages.slice(0, 10);
    }
  }

  /**
   * Get current error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  /**
   * Reset error metrics
   */
  resetMetrics(): void {
    this.errorMetrics = this.initializeMetrics();
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ErrorLogEntry[] {
    return this.errorMetrics.recentErrors.slice(0, limit);
  }

  /**
   * Get errors by level
   */
  getErrorsByLevel(level: string): ErrorLogEntry[] {
    return this.errorMetrics.recentErrors.filter(
      (error) => error.level === level
    );
  }

  /**
   * Get errors by path
   */
  getErrorsByPath(path: string): ErrorLogEntry[] {
    return this.errorMetrics.recentErrors.filter(
      (error) => error.tags?.path === path
    );
  }

  /**
   * Get error summary for a time period
   */
  getErrorSummary(hours: number = 24): {
    total: number;
    byLevel: Record<string, number>;
    byCode: Record<string, number>;
    byPath: Record<string, number>;
  } {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const recentErrors = this.errorMetrics.recentErrors.filter(
      (error) => new Date(error.timestamp || '') > cutoffTime
    );

    const summary = {
      total: recentErrors.length,
      byLevel: {} as Record<string, number>,
      byCode: {} as Record<string, number>,
      byPath: {} as Record<string, number>,
    };

    recentErrors.forEach((error) => {
      summary.byLevel[error.level] = (summary.byLevel[error.level] || 0) + 1;

      if (error.tags?.errorCode) {
        summary.byCode[error.tags.errorCode] =
          (summary.byCode[error.tags.errorCode] || 0) + 1;
      }

      if (error.tags?.path) {
        summary.byPath[error.tags.path] =
          (summary.byPath[error.tags.path] || 0) + 1;
      }
    });

    return summary;
  }
}
