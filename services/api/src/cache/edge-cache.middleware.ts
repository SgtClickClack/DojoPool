import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { EdgeCacheOptions, EdgeCacheService } from './edge-cache.service';

@Injectable()
export class EdgeCacheMiddleware implements NestMiddleware {
  constructor(private readonly edgeCacheService: EdgeCacheService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override response methods to add cache headers
    res.json = (body: any) => {
      this.addCacheHeaders(req, res);
      return originalJson.call(res, body);
    };

    res.send = (body: any) => {
      this.addCacheHeaders(req, res);
      return originalSend.call(res, body);
    };

    next();
  }

  private addCacheHeaders(req: Request, res: Response) {
    // Only add cache headers for GET requests
    if (req.method !== 'GET') {
      return;
    }

    // Skip cache headers for authenticated requests (unless explicitly configured)
    if (req.headers.authorization) {
      return;
    }

    // Get cache configuration from route metadata or defaults
    const cacheOptions = this.getCacheOptionsForRoute(req.path);

    if (cacheOptions) {
      const headers = this.edgeCacheService.generateCacheHeaders(cacheOptions);

      // Set cache headers
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add cache metadata headers
      res.setHeader('X-Edge-Cache', 'enabled');
      res.setHeader('X-Cache-TTL', cacheOptions.ttl?.toString() || '300');
    }
  }

  private getCacheOptionsForRoute(path: string): EdgeCacheOptions | null {
    // Define cache strategies for different route patterns
    const cacheStrategies: Record<string, EdgeCacheOptions> = {
      // Static content and read-heavy endpoints
      '^/api/v1/venues$': {
        ttl: 300, // 5 minutes
        browserMaxAge: 60,
        edgeMaxAge: 300,
        revalidateOnUpdate: true,
      },
      '^/api/v1/venues/[^/]+$': {
        ttl: 600, // 10 minutes
        browserMaxAge: 300,
        edgeMaxAge: 600,
        revalidateOnUpdate: true,
      },
      '^/api/v1/clans$': {
        ttl: 300, // 5 minutes
        browserMaxAge: 60,
        edgeMaxAge: 300,
        revalidateOnUpdate: true,
      },
      '^/api/v1/clans/[^/]+$': {
        ttl: 600, // 10 minutes
        browserMaxAge: 300,
        edgeMaxAge: 600,
        revalidateOnUpdate: true,
      },
      '^/api/v1/territories$': {
        ttl: 180, // 3 minutes (territories change more frequently)
        browserMaxAge: 30,
        edgeMaxAge: 180,
        revalidateOnUpdate: true,
      },
      '^/api/v1/territories/map$': {
        ttl: 120, // 2 minutes (map data changes frequently)
        browserMaxAge: 30,
        edgeMaxAge: 120,
        revalidateOnUpdate: true,
      },
      '^/api/v1/users$': {
        ttl: 600, // 10 minutes
        browserMaxAge: 300,
        edgeMaxAge: 600,
        revalidateOnUpdate: true,
      },
      '^/api/v1/strategic-map': {
        ttl: 300, // 5 minutes
        browserMaxAge: 60,
        edgeMaxAge: 300,
        revalidateOnUpdate: true,
      },
      // Health checks and dynamic content (no caching)
      '^/api/v1/health': null,
      '^/api/v1/auth': null,
      '^/api/v1/matches': null, // Matches are dynamic
      '^/api/v1/tournaments': null, // Tournaments change frequently
    };

    // Find matching pattern
    for (const [pattern, options] of Object.entries(cacheStrategies)) {
      if (new RegExp(pattern).test(path)) {
        return options;
      }
    }

    // Default: no caching for unmatched routes
    return null;
  }
}
