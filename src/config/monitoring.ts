// Monitoring configuration for DojoPool
export const monitoringConfig = {
  // Performance monitoring
  performance: {
    enabled: true,
    sampleRate: 0.1, // 10% of requests
    metrics: {
      responseTime: true,
      memoryUsage: true,
      cpuUsage: true,
      errorRate: true
    }
  },

  // Error tracking
  errorTracking: {
    enabled: true,
    captureUnhandled: true,
    maxErrorsPerMinute: 100
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
    ]
  },

  // Logging
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: 'json',
    transports: ['console', 'file']
  },

  // Metrics collection
  metrics: {
    enabled: true,
    interval: 60000, // 1 minute
    retention: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

// Logger instances
export const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

export const httpLogger = (req: any, res: any, next: any) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};

export const errorLogger = (err: any, req: any, res: any, next: any) => {
  logger.error(`${err.message} - ${req.method} ${req.url}`);
  next(err);
};

export const performanceLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${duration}ms`);
  });
  next();
};

export const metricsMiddleware = (req: any, res: any, next: any) => {
  // Basic metrics collection
  next();
};

export const healthCheck = (req: any, res: any) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    memory: process.memoryUsage(),
  });
};

export const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  process.exit(0);
};

export default monitoringConfig;
