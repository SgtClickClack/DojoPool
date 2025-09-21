import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto, ApiResponseBuilder } from '../dto/api-response.dto';

/**
 * Response interceptor that automatically wraps all responses in the standard API format
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'] || this.generateRequestId();
    
    return next.handle().pipe(
      map((data) => {
        // If the response is already in the correct format, return it as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponseDto<T>;
        }

        // Otherwise, wrap it in the standard format
        return ApiResponseBuilder.success(data, {
          requestId,
          correlationId: requestId,
        });
      }),
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
