import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JobProducer } from '../queue/producers/job.producer';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jobProducer: JobProducer
  ) {}

  @Post('batch/bulk-update')
  async bulkUpdate(
    @Body()
    body: {
      entityType: 'players' | 'matches' | 'tournaments';
      updates: Record<string, any>;
      filters?: Record<string, any>;
    }
  ) {
    const { entityType, updates, filters } = body;

    // Enqueue bulk update job
    const jobId = await this.jobProducer.enqueueBulkUpdate({
      entityType,
      updates,
      filters,
    });

    return {
      success: true,
      jobId,
      status: 'queued',
      message: `Bulk update job for ${entityType} has been queued`,
      estimatedTime: '1-5 minutes',
    };
  }

  @Post('batch/cache-invalidate')
  async invalidateCache(
    @Body()
    body: {
      patterns?: string[];
      namespaces?: string[];
    }
  ) {
    const { patterns, namespaces } = body;

    // Enqueue cache invalidation job
    const jobId = await this.jobProducer.enqueueCacheInvalidation({
      patterns,
      namespaces,
    });

    return {
      success: true,
      jobId,
      status: 'queued',
      message: 'Cache invalidation job has been queued',
      estimatedTime: '5-30 seconds',
    };
  }

  @Post('batch/data-migration')
  async migrateData(
    @Body()
    body: {
      migrationType: string;
      source: any;
      target: any;
      batchSize?: number;
    }
  ) {
    const { migrationType, source, target, batchSize = 100 } = body;

    // Enqueue data migration job (this is a placeholder - would need specific implementation)
    const jobId = await this.jobProducer.enqueueBulkUpdate({
      type: 'data-migration',
      payload: {
        migrationType,
        source,
        target,
        batchSize,
      },
    });

    return {
      success: true,
      jobId,
      status: 'queued',
      message: `Data migration job for ${migrationType} has been queued`,
      estimatedTime: '5-30 minutes',
    };
  }

  @Post('batch/statistics-update')
  async updateStatistics(
    @Body()
    body: {
      statTypes: string[];
      dateRange?: {
        start: string;
        end: string;
      };
      venues?: string[];
    }
  ) {
    const { statTypes, dateRange, venues } = body;

    // Enqueue statistics update job
    const jobId = await this.jobProducer.enqueueStatisticsUpdate({
      statTypes,
      dateRange,
      venues,
    });

    return {
      success: true,
      jobId,
      status: 'queued',
      message: `Statistics update job for ${statTypes.length} types has been queued`,
      estimatedTime: '2-10 minutes',
    };
  }

  @Post('batch/cleanup')
  async cleanup(
    @Body()
    body: {
      cleanupTypes: string[];
      retentionPeriod?: number;
    }
  ) {
    const { cleanupTypes, retentionPeriod } = body;

    // Enqueue cleanup job
    const jobId = await this.jobProducer.enqueueCleanup(
      cleanupTypes,
      retentionPeriod
    );

    return {
      success: true,
      jobId,
      status: 'queued',
      message: `Cleanup job for ${cleanupTypes.length} types has been queued`,
      estimatedTime: '1-15 minutes',
    };
  }

  @Post('batch/ai-analysis')
  async batchAIAnalysis(
    @Body()
    body: {
      matchIds: string[];
      analysisType: 'full' | 'commentary';
    }
  ) {
    const { matchIds, analysisType } = body;

    // Enqueue batch AI analysis job
    const jobId = await this.jobProducer.enqueueBatchAnalysis({
      matchIds,
      analysisType,
    });

    return {
      success: true,
      jobId,
      status: 'queued',
      message: `Batch AI analysis job for ${matchIds.length} matches has been queued`,
      estimatedTime: `${matchIds.length * 2}- ${matchIds.length * 5} minutes`,
    };
  }
}
