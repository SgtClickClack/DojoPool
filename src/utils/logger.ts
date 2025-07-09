// Production-ready logging utility to replace console.log statements
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn'; 
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info', 
  DEBUG: 'debug'
};

class Logger {
  private isDevelopment: boolean;
  private logLevel: string;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info');
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  error(message: string, context?: any): void {
    if (this.shouldLog('error')) {
      if (this.isDevelopment) {
        console.error(this.formatMessage('error', message, context));
      } else {
        // In production, send to logging service
        this.sendToLoggingService('error', message, context);
      }
    }
  }

  warn(message: string, context?: any): void {
    if (this.shouldLog('warn')) {
      if (this.isDevelopment) {
        console.warn(this.formatMessage('warn', message, context));
      } else {
        this.sendToLoggingService('warn', message, context);
      }
    }
  }

  info(message: string, context?: any): void {
    if (this.shouldLog('info')) {
      if (this.isDevelopment) {
        console.info(this.formatMessage('info', message, context));
      } else {
        this.sendToLoggingService('info', message, context);
      }
    }
  }

  debug(message: string, context?: any): void {
    if (this.shouldLog('debug') && this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  private sendToLoggingService(level: string, message: string, context?: any): void {
    // In production, send logs to external service like Winston, LogTail, etc.
    // For now, we'll use console but this should be replaced with proper service
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      environment: process.env.NODE_ENV,
      service: 'dojopool'
    };
    
    // This would be replaced with actual logging service in production
    console.log(JSON.stringify(logData));
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export { LOG_LEVELS };
export default logger;