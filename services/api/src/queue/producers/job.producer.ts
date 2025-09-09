import { Injectable, Logger } from '@nestjs/common';
import { JobsOptions } from 'bullmq';
import { QueueService } from '../queue.service';

export interface MatchAnalysisJob {
  matchId: string;
  matchData: {
    playerAName: string;
    playerBName: string;
    scoreA: number;
    scoreB: number;
    winner: string;
    shots?: any[];
    venue: string;
    round: number;
  };
}

export interface LiveCommentaryJob {
  matchId: string;
  shotData: {
    playerName?: string;
    ballSunk?: boolean;
    wasFoul?: boolean;
    position?: { x: number; y: number };
    timestamp: string;
  };
  sessionId: string;
}

export interface TableAnalysisJob {
  matchId: string;
  imageBuffer: Buffer;
  mimeType?: string;
  sessionId: string;
}

export interface BatchAnalysisJob {
  matchIds: string[];
  analysisType: 'full' | 'commentary';
}

export interface BulkUpdateJob {
  entityType: 'players' | 'matches' | 'tournaments';
  updates: Record<string, any>;
  filters?: Record<string, any>;
}

export interface CacheInvalidationJob {
  patterns?: string[];
  namespaces?: string[];
}

export interface StatisticsUpdateJob {
  statTypes: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  venues?: string[];
}

@Injectable()
export class JobProducer {
  private readonly logger = new Logger(JobProducer.name);

  constructor(private readonly queueService: QueueService) {}

  /**
   * Enqueue a match analysis job
   */
  async enqueueMatchAnalysis(
    job: MatchAnalysisJob,
    options: JobsOptions = {}
  ): Promise<string> {
    try {
      const jobId = await this.queueService.addAIAnalysisJob(
        {
          type: 'match-analysis',
          payload: job,
          metadata: {
            entityType: 'match',
            entityId: job.matchId,
            operation: 'analysis',
          },
        },
        {
          priority: 5, // High priority for real-time analysis
          delay: 0,
          ...options,
        }
      );

      this.logger.log(`Enqueued match analysis job for match ${job.matchId}`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to enqueue match analysis job:`, error);
      throw error;
    }
  }

  /**
   * Enqueue a live commentary job
   */
  async enqueueLiveCommentary(
    job: LiveCommentaryJob,
    options: JobsOptions = {}
  ): Promise<string> {
    try {
      const jobId = await this.queueService.addAIAnalysisJob(
        {
          type: 'live-commentary',
          payload: job,
          metadata: {
            entityType: 'match',
            entityId: job.matchId,
            operation: 'commentary',
            sessionId: job.sessionId,
          },
        },
        {
          priority: 8, // Very high priority for live features
          delay: 0,
          ...options,
        }
      );

      this.logger.log(`Enqueued live commentary job for match ${job.matchId}`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to enqueue live commentary job:`, error);
      throw error;
    }
  }

  /**
   * Enqueue a table analysis job
   */
  async enqueueTableAnalysis(
    job: TableAnalysisJob,
    options: JobsOptions = {}
  ): Promise<string> {
    try {
      const jobId = await this.queueService.addAIAnalysisJob(
        {
          type: 'table-analysis',
          payload: job,
          metadata: {
            entityType: 'match',
            entityId: job.matchId,
            operation: 'table-analysis',
            sessionId: job.sessionId,
          },
        },
        {
          priority: 6, // High priority for real-time analysis
          delay: 0,
          ...options,
        }
      );

      this.logger.log(`Enqueued table analysis job for match ${job.matchId}`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to enqueue table analysis job:`, error);
      throw error;
    }
  }

  /**
   * Enqueue a batch analysis job
   */
  async enqueueBatchAnalysis(
    job: BatchAnalysisJob,
    options: JobsOptions = {}
  ): Promise<string> {
    try {
      const jobId = await this.queueService.addAIAnalysisJob(
        {
          type: 'batch-analysis',
          payload: job,
          metadata: {
            entityType: 'batch',
            operation: 'analysis',
            batchSize: job.matchIds.length,
          },
        },
        {
          priority: 3, // Lower priority for batch operations
          delay: 0,
          ...options,
        }
      );

      this.logger.log(
        `Enqueued batch analysis job for ${job.matchIds.length} matches`
      );
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to enqueue batch analysis job:`, error);
      throw error;
    }
  }

  /**
   * Enqueue a bulk update job
   */
  async enqueueBulkUpdate(
    job: BulkUpdateJob,
    options: JobsOptions = {}
  ): Promise<string> {
    try {
      const jobId = await this.queueService.addBatchUpdateJob(
        {
          type: 'bulk-update',
          payload: job,
          metadata: {
            entityType: job.entityType,
            operation: 'bulk-update',
          },
        },
        {
          priority: 4, // Medium priority for bulk operations
          delay: 0,
          ...options,
        }
      );

      this.logger.log(`Enqueued bulk update job for ${job.entityType}`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to enqueue bulk update job:`, error);
      throw error;
    }
  }

  /**
   * Enqueue a cache invalidation job
   */
  async enqueueCacheInvalidation(
    job: CacheInvalidationJob,
    options: JobsOptions = {}
  ): Promise<string> {
    try {
      const jobId = await this.queueService.addBatchUpdateJob(
        {
          type: 'cache-invalidation',
          payload: job,
          metadata: {
            operation: 'cache-invalidation',
            patternsCount: job.patterns?.length || 0,
            namespacesCount: job.namespaces?.length || 0,
          },
        },
        {
          priority: 7, // High priority for cache operations
          delay: 0,
          ...options,
        }
      );

      this.logger.log(`Enqueued cache invalidation job`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to enqueue cache invalidation job:`, error);
      throw error;
    }
  }

  /**
   * Enqueue a statistics update job
   */
  async enqueueStatisticsUpdate(
    job: StatisticsUpdateJob,
    options: JobsOptions = {}
  ): Promise<string> {
    try {
      const jobId = await this.queueService.addBatchUpdateJob(
        {
          type: 'statistics-update',
          payload: job,
          metadata: {
            operation: 'statistics-update',
            statTypesCount: job.statTypes.length,
          },
        },
        {
          priority: 2, // Low priority for background stats
          delay: 0,
          ...options,
        }
      );

      this.logger.log(
        `Enqueued statistics update job for ${job.statTypes.length} types`
      );
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to enqueue statistics update job:`, error);
      throw error;
    }
  }

  /**
   * Enqueue a cleanup job
   */
  async enqueueCleanup(
    cleanupTypes: string[],
    retentionPeriod?: number,
    options: JobsOptions = {}
  ): Promise<string> {
    try {
      const jobId = await this.queueService.addBatchUpdateJob(
        {
          type: 'cleanup',
          payload: {
            cleanupTypes,
            retentionPeriod,
          },
          metadata: {
            operation: 'cleanup',
            typesCount: cleanupTypes.length,
          },
        },
        {
          priority: 1, // Lowest priority for maintenance
          delay: 0,
          ...options,
        }
      );

      this.logger.log(`Enqueued cleanup job for ${cleanupTypes.length} types`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to enqueue cleanup job:`, error);
      throw error;
    }
  }

  /**
   * Schedule a job for later execution
   */
  async scheduleJob(
    jobType:
      | 'match-analysis'
      | 'batch-analysis'
      | 'statistics-update'
      | 'cleanup',
    payload: any,
    delay: number, // in milliseconds
    options: JobsOptions = {}
  ): Promise<string> {
    try {
      let jobId: string;

      switch (jobType) {
        case 'match-analysis':
          jobId = await this.queueService.addAIAnalysisJob(
            {
              type: 'match-analysis',
              payload,
              metadata: { scheduled: true },
            },
            { delay, ...options }
          );
          break;

        case 'batch-analysis':
          jobId = await this.queueService.addAIAnalysisJob(
            {
              type: 'batch-analysis',
              payload,
              metadata: { scheduled: true },
            },
            { delay, ...options }
          );
          break;

        case 'statistics-update':
          jobId = await this.queueService.addBatchUpdateJob(
            {
              type: 'statistics-update',
              payload,
              metadata: { scheduled: true },
            },
            { delay, ...options }
          );
          break;

        case 'cleanup':
          jobId = await this.queueService.addBatchUpdateJob(
            {
              type: 'cleanup',
              payload,
              metadata: { scheduled: true },
            },
            { delay, ...options }
          );
          break;

        default:
          throw new Error(`Unsupported job type for scheduling: ${jobType}`);
      }

      this.logger.log(`Scheduled ${jobType} job to run in ${delay}ms`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to schedule job:`, error);
      throw error;
    }
  }
}
