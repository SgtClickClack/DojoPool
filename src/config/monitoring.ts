import { Request, Response, NextFunction } from 'express';

// Simple console-based logger for development
export const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

// Simple HTTP logging middleware
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
};

// Simple error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error in ${req.method} ${req.originalUrl}: ${err.message}`);
  next(err);
};

// Simple performance logging middleware
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  next();
};

// Simple metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Basic metrics collection could go here
  next();
};

// Simple health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    memory: process.memoryUsage(),
  });
};

// Simple graceful shutdown
export const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  process.exit(0);
};