import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

// Monitoring configuration for DojoPool
export const monitoringConfig = {
  // Performance monitoring
  performance: {
    enabled: true,
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    metrics: {
      responseTime: true,
      memoryUsage: true,
      cpuUsage: true,
      errorRate: true,
      activeConnections: true
    },
    slowRequestThreshold: 1000, // 1 second
    memoryWarningThreshold: 500 * 1024 * 1024 // 500MB
  },

  // Error tracking
  errorTracking: {
    enabled: true,
    captureUnhandled: true,
    maxErrorsPerMinute: 100,
    excludeStatusCodes: [400, 401, 403, 404], // Don't log client errors as server errors
    stackTraceLimit: 10
  },

  // Health checks
  healthChecks: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    endpoints: [
      '/api/health',
      '/api/database/health',
      '/api/redis/health'
    ],
    criticalServices: ['database', 'redis', 'external_api']
  },

  // Logging with winston configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: 'json',
    transports: ['console', 'file'],
    maxFiles: 5,
    maxSize: '20m',
    datePattern: 'YYYY-MM-DD'
  },

  // Metrics collection
  metrics: {
    enabled: true,
    interval: 60000, // 1 minute
    retention: 7 * 24 * 60 * 60 * 1000, // 7 days
    aggregationWindows: [60000, 300000, 3600000], // 1min, 5min, 1hour
    enablePrometheus: process.env.ENABLE_PROMETHEUS === 'true'
  },

  // Rate limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }
};

// Enhanced logger with winston
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true })
);

const logger = winston.createLogger({
  level: monitoringConfig.logging.level,
  format: logFormat,
  defaultMeta: { 
    service: 'dojopool-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxFiles: monitoringConfig.logging.maxFiles,
      maxsize: 20971520 // 20MB
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxFiles: monitoringConfig.logging.maxFiles,
      maxsize: 20971520 // 20MB
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Performance tracking
interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  activeConnections: number;
  slowRequests: number;
}

const performanceMetrics: PerformanceMetrics = {
  requestCount: 0,
  errorCount: 0,
  totalResponseTime: 0,
  averageResponseTime: 0,
  memoryUsage: process.memoryUsage(),
  activeConnections: 0,
  slowRequests: 0
};

// Memory monitoring
let lastMemoryCheck = Date.now();
const checkMemoryUsage = () => {
  const now = Date.now();
  if (now - lastMemoryCheck > 60000) { // Check every minute
    const memUsage = process.memoryUsage();
    performanceMetrics.memoryUsage = memUsage;
    
    if (memUsage.heapUsed > monitoringConfig.performance.memoryWarningThreshold) {
      logger.warn('High memory usage detected', {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      });
    }
    
    lastMemoryCheck = now;
  }
};

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  const clientIp = req.ip || req.connection.remoteAddress;
  
  performanceMetrics.requestCount++;
  performanceMetrics.activeConnections++;
  
  // Check memory usage periodically
  checkMemoryUsage();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    performanceMetrics.activeConnections--;
    performanceMetrics.totalResponseTime += duration;
    performanceMetrics.averageResponseTime = performanceMetrics.totalResponseTime / performanceMetrics.requestCount;
    
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: Math.round(duration * 100) / 100, // Round to 2 decimal places
      userAgent: req.get('User-Agent'),
      clientIp,
      contentLength: res.get('Content-Length')
    };
    
    // Log slow requests
    if (duration > monitoringConfig.performance.slowRequestThreshold) {
      performanceMetrics.slowRequests++;
      logger.warn('Slow request detected', { ...logData, slow: true });
    } else if (monitoringConfig.performance.sampleRate === 1.0 || Math.random() < monitoringConfig.performance.sampleRate) {
      logger.info('HTTP Request', logData);
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      if (res.statusCode >= 500) {
        performanceMetrics.errorCount++;
        logger.error('HTTP Error', logData);
      } else if (!monitoringConfig.errorTracking.excludeStatusCodes.includes(res.statusCode)) {
        logger.warn('HTTP Client Error', logData);
      }
    }
  });
  
  next();
};

export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  performanceMetrics.errorCount++;
  
  const errorData = {
    error: {
      message: err.message,
      stack: monitoringConfig.errorTracking.stackTraceLimit > 0 ? 
        err.stack?.split('\n').slice(0, monitoringConfig.errorTracking.stackTraceLimit).join('\n') : 
        undefined,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined
    },
    timestamp: new Date().toISOString()
  };
  
  logger.error('Unhandled error in request', errorData);
  next(err);
};

export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;
    
    if (monitoringConfig.performance.metrics.responseTime) {
      logger.debug('Performance metrics', {
        url: req.url,
        method: req.method,
        responseTime: duration,
        memoryUsage: process.memoryUsage(),
        activeConnections: performanceMetrics.activeConnections
      });
    }
  });
  
  next();
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Track request patterns for analytics
  if (monitoringConfig.metrics.enabled) {
    const timestamp = Date.now();
    const routePattern = req.route?.path || req.url;
    
    // Store metrics (in production, this would go to a proper metrics store)
    logger.debug('Metrics collection', {
      route: routePattern,
      method: req.method,
      timestamp,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    });
  }
  
  next();
};

export const healthCheck = (req: Request, res: Response) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    pid: process.pid,
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    },
    performance: {
      requests: performanceMetrics.requestCount,
      errors: performanceMetrics.errorCount,
      averageResponseTime: Math.round(performanceMetrics.averageResponseTime * 100) / 100,
      activeConnections: performanceMetrics.activeConnections,
      slowRequests: performanceMetrics.slowRequests,
      errorRate: performanceMetrics.requestCount > 0 ? 
        Math.round((performanceMetrics.errorCount / performanceMetrics.requestCount) * 10000) / 100 : 0
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version
  };
  
  // Determine health status
  const isHealthy = 
    memUsage.heapUsed < monitoringConfig.performance.memoryWarningThreshold &&
    performanceMetrics.errorCount < monitoringConfig.errorTracking.maxErrorsPerMinute &&
    performanceMetrics.activeConnections < 1000; // Arbitrary connection limit
  
  const statusCode = isHealthy ? 200 : 503;
  healthData.status = isHealthy ? 'healthy' : 'unhealthy';
  
  res.status(statusCode).json(healthData);
};

export const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`, {
    signal,
    uptime: process.uptime(),
    finalMetrics: performanceMetrics
  });
  
  // Cleanup operations
  setTimeout(() => {
    logger.info('Graceful shutdown completed');
    process.exit(0);
  }, 5000); // Give 5 seconds for cleanup
};

// Export individual logger methods for backwards compatibility
export { logger };
export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logError = (message: string, meta?: any) => logger.error(message, meta);
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);

// Export performance metrics for monitoring endpoints
export const getPerformanceMetrics = () => ({ ...performanceMetrics });

// Periodic metrics reporting
if (monitoringConfig.metrics.enabled && monitoringConfig.metrics.interval > 0) {
  setInterval(() => {
    logger.info('Periodic metrics report', {
      type: 'metrics',
      data: {
        ...performanceMetrics,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  }, monitoringConfig.metrics.interval);
}

export default monitoringConfig;
