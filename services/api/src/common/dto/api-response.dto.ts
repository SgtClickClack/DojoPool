import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API Response Structure
 * All API endpoints should return responses in this format for consistency
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success!: boolean;

  @ApiProperty({ description: 'Response data payload' })
  data?: T;

  @ApiProperty({ description: 'Error information (only present when success is false)', required: false })
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
    path: string;
  };

  @ApiProperty({ description: 'Response metadata', required: false })
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
    pagination?: PaginationMeta;
    retryable?: boolean;
    retryAfter?: number;
    correlationId?: string;
  };
}

/**
 * Pagination metadata for list responses
 */
export class PaginationMeta {
  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Number of items per page' })
  pageSize!: number;

  @ApiProperty({ description: 'Total number of items' })
  total!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext!: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrevious!: boolean;
}

/**
 * Standard success response builder
 */
export class ApiResponseBuilder {
  static success<T>(data: T, meta?: Partial<ApiResponseDto<T>['meta']>): ApiResponseDto<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        version: '1.0',
        ...meta,
      },
    };
  }

  static successWithPagination<T>(
    data: T[],
    pagination: PaginationMeta,
    meta?: Partial<ApiResponseDto<T[]>['meta']>
  ): ApiResponseDto<T[]> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        version: '1.0',
        pagination,
        ...meta,
      },
    };
  }

  static error(
    code: string,
    message: string,
    details?: any,
    meta?: Partial<ApiResponseDto['meta']>
  ): ApiResponseDto {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        path: '', // Will be set by the error handler
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        version: '1.0',
        ...meta,
      },
    };
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Common response types for different operations
 */
export class CreatedResponseDto<T> extends ApiResponseDto<T> {
  @ApiProperty({ description: 'HTTP status code', example: 201 })
  statusCode!: 201;
}

export class UpdatedResponseDto<T> extends ApiResponseDto<T> {
  @ApiProperty({ description: 'HTTP status code', example: 200 })
  statusCode!: 200;
}

export class DeletedResponseDto extends ApiResponseDto<null> {
  @ApiProperty({ description: 'HTTP status code', example: 204 })
  statusCode!: 204;
}

export class NotFoundResponseDto extends ApiResponseDto<null> {
  @ApiProperty({ description: 'HTTP status code', example: 404 })
  statusCode!: 404;
}

export class BadRequestResponseDto extends ApiResponseDto<null> {
  @ApiProperty({ description: 'HTTP status code', example: 400 })
  statusCode!: 400;
}

export class UnauthorizedResponseDto extends ApiResponseDto<null> {
  @ApiProperty({ description: 'HTTP status code', example: 401 })
  statusCode!: 401;
}

export class ForbiddenResponseDto extends ApiResponseDto<null> {
  @ApiProperty({ description: 'HTTP status code', example: 403 })
  statusCode!: 403;
}

export class ConflictResponseDto extends ApiResponseDto<null> {
  @ApiProperty({ description: 'HTTP status code', example: 409 })
  statusCode!: 409;
}

export class InternalServerErrorResponseDto extends ApiResponseDto<null> {
  @ApiProperty({ description: 'HTTP status code', example: 500 })
  statusCode!: 500;
}
