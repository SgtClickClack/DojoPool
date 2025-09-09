import { Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CacheManagementService } from './cache-management.service';
import { CacheRevalidationService } from './cache-revalidation.service';
import { EdgeCacheService } from './edge-cache.service';

@Controller('admin/cache')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class CacheController {
  constructor(
    private readonly edgeCacheService: EdgeCacheService,
    private readonly revalidationService: CacheRevalidationService,
    private readonly cacheManagementService: CacheManagementService
  ) {}

  @Get('stats')
  async getCacheStats() {
    return await this.edgeCacheService.getCacheStats();
  }

  @Get('health')
  async getCacheHealth() {
    return await this.cacheManagementService.getCacheHealth();
  }

  @Get('metrics')
  async getCacheMetrics() {
    return await this.cacheManagementService.getCacheMetrics();
  }

  @Get('metrics/history')
  async getHistoricalMetrics() {
    return this.cacheManagementService.getHistoricalMetrics(24);
  }

  @Get('recommendations')
  async getRecommendations() {
    return await this.cacheManagementService.getRecommendations();
  }

  @Post('warmup')
  async warmupCache() {
    await this.cacheManagementService.warmupCache();
    return { success: true, message: 'Cache warmup initiated' };
  }

  @Post('optimize')
  async optimizeCache() {
    await this.cacheManagementService.optimizeCache();
    return { success: true, message: 'Cache optimization completed' };
  }

  @Delete('purge')
  async purgeCache() {
    await this.revalidationService.emergencyPurge();
    return { success: true, message: 'Emergency cache purge completed' };
  }

  @Delete('invalidate/:pattern')
  async invalidatePattern(pattern: string) {
    await this.edgeCacheService.invalidateEdgeCache([pattern]);
    return { success: true, message: `Invalidated cache pattern: ${pattern}` };
  }

  @Get('patterns')
  async getRevalidationPatterns() {
    return this.revalidationService.getRevalidationPatterns();
  }

  @Post('maintenance')
  async runMaintenance() {
    await this.cacheManagementService.hourlyMaintenance();
    return { success: true, message: 'Maintenance tasks completed' };
  }
}
