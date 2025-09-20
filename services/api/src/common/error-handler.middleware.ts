import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { ErrorLoggerService } from '../monitoring/error-logger.service';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
    path: string;
  };
  meta?: {
    retryable: boolean;
    retryAfter?: number;
    correlationId: string;
  };
}

@Catch()
export class GlobalErrorHandler implements ExceptionFilter {
  private readonly logger = new Logger(GlobalErrorHandler.name);

  constructor(private readonly errorLogger: ErrorLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const userAgent = request.get('User-Agent') || 'Unknown';
    const ip = this.getClientIP(request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = null;
    let retryable = false;
    let retryAfter: number | undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errorCode = this.getErrorCodeFromStatus(status);
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;
        errorCode = responseObj.code || this.getErrorCodeFromStatus(status);
        details = responseObj.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = {
        name: exception.name,
        stack: exception.stack,
      };

      // Categorize common errors
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'VALIDATION_ERROR';
      } else if (exception.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'INVALID_DATA_FORMAT';
      } else if (exception.message.includes('ECONNREFUSED')) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        errorCode = 'SERVICE_UNAVAILABLE';
        retryable = true;
        retryAfter = 30;
      } else if (exception.message.includes('timeout')) {
        status = HttpStatus.REQUEST_TIMEOUT;
        errorCode = 'REQUEST_TIMEOUT';
        retryable = true;
      } else if (exception.message.includes('rate limit')) {
        status = HttpStatus.TOO_MANY_REQUESTS;
        errorCode = 'RATE_LIMIT_EXCEEDED';
        retryable = true;
        retryAfter = 60;
      }
    }

    // Log the error with structured data
    this.errorLogger.logError({
      level: status >= 500 ? 'error' : 'warn',
      message: `${method} ${path} - ${errorCode}: ${message}`,
      error:
        exception instanceof Error ? exception : new Error(String(exception)),
      context: {
        requestId,
        method,
        path,
        status,
        userAgent,
        ip,
        timestamp,
        errorCode,
        details,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
      tags: {
        status: status.toString(),
        method,
        path: path.split('?')[0], // Remove query params
        errorCode,
        userAgent: userAgent.substring(0, 100), // Truncate for privacy
      },
    });

    // Log critical errors to console as well
    if (status >= 500) {
      this.logger.error(
        `Critical Error [${requestId}]: ${method} ${path} - ${message}`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    } else {
      this.logger.warn(
        `Client Error [${requestId}]: ${method} ${path} - ${message}`
      );
    }

    // Send structured error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: this.getUserFriendlyMessage(errorCode, message),
        details: process.env.NODE_ENV === 'development' ? details : undefined,
        timestamp,
        requestId,
        path,
      },
      meta: {
        retryable,
        correlationId: requestId,
        ...(retryAfter && { retryAfter }),
      },
    };

    response.status(status).json(errorResponse);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(request: Request): string {
    const forwarded = request.get('x-forwarded-for');
    const realIP = request.get('x-real-ip');
    const clientIP = request.get('x-client-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) return realIP;
    if (clientIP) return clientIP;

    return request.ip || request.connection.remoteAddress || 'unknown';
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return statusMap[status] || 'UNKNOWN_ERROR';
  }

  private getUserFriendlyMessage(
    errorCode: string,
    originalMessage: string
  ): string {
    const userMessages: Record<string, string> = {
      BAD_REQUEST:
        'The request was invalid. Please check your input and try again.',
      UNAUTHORIZED: 'You need to be logged in to access this resource.',
      FORBIDDEN: 'You do not have permission to access this resource.',
      NOT_FOUND: 'The requested resource was not found.',
      CONFLICT: 'This action conflicts with the current state.',
      VALIDATION_ERROR: 'Please check your input data and try again.',
      RATE_LIMIT_EXCEEDED:
        'Too many requests. Please wait a moment and try again.',
      REQUEST_TIMEOUT:
        'The request took too long to process. Please try again.',
      SERVICE_UNAVAILABLE:
        'The service is temporarily unavailable. Please try again later.',
      INTERNAL_SERVER_ERROR:
        'Something went wrong on our end. Please try again.',
      BAD_GATEWAY:
        'There was an issue connecting to our services. Please try again.',
      GATEWAY_TIMEOUT: 'The request timed out. Please try again.',
      INVALID_DATA_FORMAT: 'The provided data format is invalid.',
    };

    return userMessages[errorCode] || originalMessage;
  }
}
