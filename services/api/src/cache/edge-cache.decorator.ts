import { SetMetadata } from '@nestjs/common';
import { EdgeCacheOptions } from './edge-cache.service';

export const EDGE_CACHE_KEY = 'edge_cache_options';
export const CACHE_INVALIDATE_KEY = 'cache_invalidate_patterns';

/**
 * Decorator for enabling edge caching on controller methods
 */
export function EdgeCache(options: EdgeCacheOptions = {}) {
  return SetMetadata(EDGE_CACHE_KEY, options);
}

/**
 * Decorator for cache invalidation patterns on write operations
 */
export function CacheInvalidate(patterns: string[]) {
  return SetMetadata(CACHE_INVALIDATE_KEY, patterns);
}

/**
 * Decorator for read-heavy endpoints with automatic cache invalidation
 */
export function ReadOptimized(
  options: EdgeCacheOptions & { invalidatePatterns?: string[] } = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Set edge cache options
    SetMetadata(EDGE_CACHE_KEY, {
      ttl: 300, // 5 minutes default
      browserMaxAge: 60,
      edgeMaxAge: 300,
      revalidateOnUpdate: true,
      ...options,
    })(target, propertyKey, descriptor);

    // Set invalidation patterns if provided
    if (options.invalidatePatterns && options.invalidatePatterns.length > 0) {
      SetMetadata(CACHE_INVALIDATE_KEY, options.invalidatePatterns)(
        target,
        propertyKey,
        descriptor
      );
    }
  };
}

/**
 * Decorator for static content that rarely changes
 */
export function StaticContent(ttl: number = 3600) {
  return SetMetadata(EDGE_CACHE_KEY, {
    ttl,
    browserMaxAge: ttl,
    edgeMaxAge: ttl * 2, // CDN caches longer
    staleWhileRevalidate: ttl / 2,
    cacheControl: `max-age=${ttl}, s-maxage=${ttl * 2}, stale-while-revalidate=${ttl / 2}, immutable`,
  });
}

/**
 * Decorator for user-specific content
 */
export function UserSpecific(options: EdgeCacheOptions = {}) {
  return SetMetadata(EDGE_CACHE_KEY, {
    ttl: 180, // 3 minutes for user-specific content
    browserMaxAge: 0, // No browser caching for personalized content
    edgeMaxAge: 180,
    vary: ['Authorization', 'Accept', 'Accept-Encoding'],
    ...options,
  });
}

/**
 * Decorator for frequently changing content
 */
export function DynamicContent(options: EdgeCacheOptions = {}) {
  return SetMetadata(EDGE_CACHE_KEY, {
    ttl: 60, // 1 minute
    browserMaxAge: 0,
    edgeMaxAge: 60,
    staleWhileRevalidate: 30,
    ...options,
  });
}

/**
 * Decorator for venue-related endpoints
 */
export function VenueCache(options: Partial<EdgeCacheOptions> = {}) {
  return ReadOptimized({
    ttl: 300,
    browserMaxAge: 60,
    edgeMaxAge: 300,
    invalidatePatterns: ['venues:list', 'venues:detail:*', 'strategic-map:*'],
    ...options,
  });
}

/**
 * Decorator for clan-related endpoints
 */
export function ClanCache(options: Partial<EdgeCacheOptions> = {}) {
  return ReadOptimized({
    ttl: 300,
    browserMaxAge: 60,
    edgeMaxAge: 300,
    invalidatePatterns: ['clans:list', 'clans:detail:*', 'territories:clan:*'],
    ...options,
  });
}

/**
 * Decorator for territory-related endpoints
 */
export function TerritoryCache(options: Partial<EdgeCacheOptions> = {}) {
  return ReadOptimized({
    ttl: 180,
    browserMaxAge: 30,
    edgeMaxAge: 180,
    invalidatePatterns: ['territories:*', 'territories:map', 'strategic-map:*'],
    ...options,
  });
}

/**
 * Decorator for strategic map data
 */
export function MapCache(options: Partial<EdgeCacheOptions> = {}) {
  return ReadOptimized({
    ttl: 120,
    browserMaxAge: 30,
    edgeMaxAge: 120,
    invalidatePatterns: ['strategic-map:*', 'territories:map'],
    vary: ['Accept', 'Accept-Encoding', 'User-Agent'],
    ...options,
  });
}
