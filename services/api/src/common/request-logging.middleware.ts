import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface RequestLoggingConfig {
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  logHeaders?: boolean;
  excludePaths?: string[];
  maxBodyLength?: number;
  sensitiveFields?: string[];
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);
  private config: RequestLoggingConfig;

  constructor(config: RequestLoggingConfig = {}) {
    this.config = {
      logRequestBody: false,
      logResponseBody: false,
      logHeaders: false,
      excludePaths: ['/health', '/metrics'],
      maxBodyLength: 1000,
      sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
      ...config,
    };
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip logging for excluded paths
    if (this.config.excludePaths?.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Add request ID to request object for use in other middleware
    (req as Request & { requestId?: string }).requestId = requestId;

    // Log request
    this.logRequest(req, requestId);

    // Override response methods to log response
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function (body) {
      this.logResponse(req, res, startTime, requestId, body);
      return originalSend.call(this, body);
    }.bind(this);

    res.json = function (body) {
      this.logResponse(req, res, startTime, requestId, body);
      return originalJson.call(this, body);
    }.bind(this);

    next();
  }

  private logRequest(req: Request, requestId: string) {
    const logData: Record<string, unknown> = {
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };

    if (this.config.logHeaders) {
      logData.headers = this.sanitizeHeaders(req.headers);
    }

    if (this.config.logRequestBody && req.body) {
      logData.body = this.sanitizeData(req.body);
    }

    this.logger.log(`Incoming Request [${requestId}]`, logData);
  }

  private logResponse(
    req: Request,
    res: Response,
    startTime: number,
    requestId: string,
    body: unknown
  ) {
    const duration = Date.now() - startTime;

    const logData: Record<string, unknown> = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    if (this.config.logResponseBody && body) {
      logData.responseBody = this.sanitizeData(body);
    }

    // Log level based on status code
    if (res.statusCode >= 500) {
      this.logger.error(`Response [${requestId}]`, logData);
    } else if (res.statusCode >= 400) {
      this.logger.warn(`Response [${requestId}]`, logData);
    } else {
      this.logger.log(`Response [${requestId}]`, logData);
    }
  }

  private sanitizeHeaders(
    headers: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized = { ...headers };

    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];

    return sanitized;
  }

  private sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized: Record<string, unknown> | unknown[] = Array.isArray(data)
      ? [...data]
      : { ...(data as Record<string, unknown>) };

    for (const key in sanitized) {
      if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
        const lowerKey = key.toLowerCase();

        // Check if field is sensitive
        if (
          this.config.sensitiveFields?.some((field) => lowerKey.includes(field))
        ) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        } else if (
          typeof sanitized[key] === 'string' &&
          sanitized[key].length > this.config.maxBodyLength!
        ) {
          sanitized[key] =
            sanitized[key].substring(0, this.config.maxBodyLength) +
            '...[TRUNCATED]';
        }
      }
    }

    return sanitized;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
