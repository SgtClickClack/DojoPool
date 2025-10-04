import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ErrorLoggerService } from '../monitoring/error-logger.service';
import { CircuitBreakerMiddleware } from './circuit-breaker.middleware';
import { GlobalErrorHandler } from './error-handler.middleware';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { RequestLoggingMiddleware } from './request-logging.middleware';

@Module({
  providers: [
    ErrorLoggerService,
    {
      provide: APP_FILTER,
      useClass: GlobalErrorHandler,
    },
    // Rate limiting configurations for different endpoints
    {
      provide: 'RATE_LIMIT_AUTH',
      useFactory: () =>
        new RateLimitMiddleware({
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 5, // 5 attempts per window
          keyGenerator: (req) => `${req.ip}:${req.body?.email || 'unknown'}`,
        }),
    },
    {
      provide: 'RATE_LIMIT_API',
      useFactory: () =>
        new RateLimitMiddleware({
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100, // 100 requests per window
          keyGenerator: (req) => req.ip || 'unknown',
        }),
    },
    {
      provide: 'RATE_LIMIT_STRICT',
      useFactory: () =>
        new RateLimitMiddleware({
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 10, // 10 requests per minute
          keyGenerator: (req) => req.ip || 'unknown',
        }),
    },
    // Circuit breaker configurations
    {
      provide: 'CIRCUIT_BREAKER_DEFAULT',
      useFactory: () =>
        new CircuitBreakerMiddleware({
          failureThreshold: 5,
          recoveryTimeout: 30000, // 30 seconds
          monitoringPeriod: 60000, // 1 minute
        }),
    },
    {
      provide: 'CIRCUIT_BREAKER_STRICT',
      useFactory: () =>
        new CircuitBreakerMiddleware({
          failureThreshold: 3,
          recoveryTimeout: 60000, // 1 minute
          monitoringPeriod: 120000, // 2 minutes
        }),
    },
    // Request logging configurations
    {
      provide: 'REQUEST_LOGGING_DEFAULT',
      useFactory: () =>
        new RequestLoggingMiddleware({
          logRequestBody: false,
          logResponseBody: false,
          logHeaders: false,
          excludePaths: ['/health', '/metrics', '/favicon.ico'],
          maxBodyLength: 1000,
          sensitiveFields: [
            'password',
            'token',
            'secret',
            'key',
            'authorization',
          ],
        }),
    },
    {
      provide: 'REQUEST_LOGGING_DEBUG',
      useFactory: () =>
        new RequestLoggingMiddleware({
          logRequestBody: true,
          logResponseBody: true,
          logHeaders: true,
          excludePaths: ['/health', '/metrics'],
          maxBodyLength: 2000,
          sensitiveFields: [
            'password',
            'token',
            'secret',
            'key',
            'authorization',
          ],
        }),
    },
  ],
  exports: [
    'RATE_LIMIT_AUTH',
    'RATE_LIMIT_API',
    'RATE_LIMIT_STRICT',
    'CIRCUIT_BREAKER_DEFAULT',
    'CIRCUIT_BREAKER_STRICT',
    'REQUEST_LOGGING_DEFAULT',
    'REQUEST_LOGGING_DEBUG',
  ],
})
export class MiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request logging to all routes
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');

    // Apply circuit breaker to all API routes
    consumer.apply(CircuitBreakerMiddleware).forRoutes('*');

    // Apply rate limiting based on route patterns
    consumer.apply(RateLimitMiddleware).forRoutes(
      { path: 'auth/*', method: RequestMethod.POST }, // Strict rate limiting for auth
      { path: 'api/*', method: RequestMethod.ALL } // General API rate limiting
    );
  }
}
