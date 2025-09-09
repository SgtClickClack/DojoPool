import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheManagementService } from './cache-management.service';
import { CacheRevalidationService } from './cache-revalidation.service';
import { CacheController } from './cache.controller';
import { CacheHelper } from './cache.helper';
import { CacheService } from './cache.service';
import { EdgeCacheInterceptor } from './edge-cache.interceptor';
import { EdgeCacheMiddleware } from './edge-cache.middleware';
import { EdgeCacheService } from './edge-cache.service';
import { EnhancedCacheService } from './enhanced-cache.service';
import { StandardizedCacheService } from './standardized-cache.service';

@Global()
@Module({
  providers: [
    CacheService,
    CacheHelper,
    EnhancedCacheService,
    StandardizedCacheService,
    EdgeCacheService,
    CacheRevalidationService,
    CacheManagementService,
    EdgeCacheMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: EdgeCacheInterceptor,
    },
  ],
  controllers: [CacheController],
  exports: [
    CacheService,
    CacheHelper,
    EnhancedCacheService,
    StandardizedCacheService,
    EdgeCacheService,
    CacheRevalidationService,
    CacheManagementService,
    EdgeCacheMiddleware,
  ],
})
export class CacheModule {}
