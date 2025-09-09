import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheRevalidationService } from './cache-revalidation.service';
import { CACHE_INVALIDATE_KEY, EDGE_CACHE_KEY } from './edge-cache.decorator';
import { EdgeCacheService } from './edge-cache.service';

@Injectable()
export class EdgeCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EdgeCacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly edgeCacheService: EdgeCacheService,
    private readonly revalidationService: CacheRevalidationService
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Check if edge caching is enabled for this endpoint
    const cacheOptions = this.reflector.get(EDGE_CACHE_KEY, handler);
    if (!cacheOptions) {
      return this.handleRevalidation(context, next);
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(request, controller, handler);

    try {
      // Try to get from edge cache
      const cachedResult = await this.edgeCacheService.getWithEdgeCache(
        cacheKey,
        () => this.executeHandler(next),
        cacheOptions
      );

      // Set cache headers on response
      Object.entries(cachedResult.headers).forEach(([key, value]) => {
        response.setHeader(key, value);
      });

      // Add cache metadata
      response.setHeader('X-Cache-Key', cacheKey);
      response.setHeader('X-Cache-Hit', cachedResult.cached.toString());

      if (cachedResult.cached) {
        this.logger.debug(`Cache HIT for key: ${cacheKey}`);
        return of(cachedResult.data);
      } else {
        this.logger.debug(`Cache MISS for key: ${cacheKey}`);
      }

      return next.handle().pipe(
        tap(async (data) => {
          // Handle revalidation for write operations
          await this.handleRevalidation(context, of(data));
        })
      );
    } catch (error) {
      this.logger.error(`Edge cache error for key ${cacheKey}:`, error);
      // Fallback to normal execution
      return this.handleRevalidation(context, next);
    }
  }

  private async executeHandler(next: CallHandler): Promise<any> {
    return new Promise((resolve, reject) => {
      next.handle().subscribe({
        next: resolve,
        error: reject,
      });
    });
  }

  private handleRevalidation(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const handler = context.getHandler();

    // Check if cache invalidation is required
    const invalidatePatterns = this.reflector.get(
      CACHE_INVALIDATE_KEY,
      handler
    );

    if (!invalidatePatterns || invalidatePatterns.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Extract entity information from result or request
          const request = context.switchToHttp().getRequest();
          const entityInfo = this.extractEntityInfo(request, result);

          if (entityInfo) {
            await this.revalidationService.handleRevalidation({
              entityType: entityInfo.entityType,
              entityId: entityInfo.entityId,
              operation: this.getOperationType(request.method),
              newData: result,
              metadata: {
                patterns: invalidatePatterns,
                endpoint: request.path,
                method: request.method,
              },
            });
          } else {
            // Fallback: invalidate patterns directly
            await this.edgeCacheService.invalidateEdgeCache(invalidatePatterns);
          }

          this.logger.debug(
            `Cache invalidation completed for patterns: ${invalidatePatterns.join(', ')}`
          );
        } catch (error) {
          this.logger.error('Cache revalidation failed:', error);
        }
      })
    );
  }

  private generateCacheKey(
    request: any,
    controller: any,
    handler: any
  ): string {
    const controllerName = controller.name
      .replace('Controller', '')
      .toLowerCase();
    const handlerName = handler.name;
    const queryParams = request.query || {};
    const pathParams = request.params || {};

    // Remove sensitive parameters from cache key
    const safeQueryParams = { ...queryParams };
    delete safeQueryParams.api_key;
    delete safeQueryParams.token;
    delete safeQueryParams.authorization;

    return this.edgeCacheService.generateEdgeCacheKey(
      `${controllerName}:${handlerName}`,
      { ...safeQueryParams, ...pathParams },
      request.user?.userId || request.user?.sub
    );
  }

  private extractEntityInfo(
    request: any,
    result: any
  ): { entityType: string; entityId: string } | null {
    // Try to extract entity info from URL path
    const pathSegments = request.path.split('/').filter(Boolean);

    // Common patterns for entity extraction
    if (pathSegments.includes('venues') && request.params.id) {
      return { entityType: 'venue', entityId: request.params.id };
    }

    if (pathSegments.includes('clans') && request.params.clanId) {
      return { entityType: 'clan', entityId: request.params.clanId };
    }

    if (pathSegments.includes('territories') && request.params.territoryId) {
      return { entityType: 'territory', entityId: request.params.territoryId };
    }

    if (pathSegments.includes('users') && request.params.id) {
      return { entityType: 'user', entityId: request.params.id };
    }

    // Try to extract from result data
    if (result && typeof result === 'object') {
      if (result.id && result.name) {
        // Guess entity type from result structure
        if (result.address || result.location) {
          return { entityType: 'venue', entityId: result.id };
        }
        if (result.members || result.leaderId) {
          return { entityType: 'clan', entityId: result.id };
        }
        if (result.ownerId || result.defense) {
          return { entityType: 'territory', entityId: result.id };
        }
      }
    }

    return null;
  }

  private getOperationType(method: string): 'create' | 'update' | 'delete' {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'update';
    }
  }
}
