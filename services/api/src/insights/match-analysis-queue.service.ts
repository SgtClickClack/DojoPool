import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
  MatchAnalysisJobData,
  MatchAnalysisProcessor,
} from './match-analysis.processor';

@Injectable()
export class MatchAnalysisQueueService implements OnModuleInit {
  private readonly logger = new Logger(MatchAnalysisQueueService.name);
  private readonly queueKey = 'match-analysis-queue';
  private readonly processingKey = 'match-analysis-processing';

  constructor(
    private readonly redisService: RedisService,
    private readonly matchAnalysisProcessor: MatchAnalysisProcessor
  ) {}

  async onModuleInit() {
    // Clean up old jobs on startup
    await this.cleanupOldJobs();
    // Start processing jobs
    this.startJobProcessor();
  }

  /**
   * Queue a match for AI analysis
   */
  async queueMatchAnalysis(
    matchId: string,
    playerAId: string,
    playerBId: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    const jobId = `match-analysis-${matchId}-${Date.now()}`;
    const jobData: MatchAnalysisJobData & { jobId: string; createdAt: number } =
      {
        jobId,
        matchId,
        playerAId,
        playerBId,
        priority,
        createdAt: Date.now(),
      };

    // Add to queue with priority-based sorting
    const priorityScore =
      priority === 'high' ? 100 : priority === 'normal' ? 50 : 10;
    const score = priorityScore + Date.now() / 1000; // Higher score = higher priority

    await this.redisService.zadd(this.queueKey, score, JSON.stringify(jobData));

    this.logger.log(
      `Queued match analysis job ${jobId} for match ${matchId} with priority ${priority}`
    );
    return jobId;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    // Check if job is currently processing
    const processingJob = await this.redisService.get(
      `${this.processingKey}:${jobId}`
    );
    if (processingJob) {
      return {
        id: jobId,
        state: 'active',
        data: JSON.parse(processingJob),
        startedAt: Date.now(),
      };
    }

    // Check if job exists in queue
    const queueJobs = await this.redisService.zrange(this.queueKey, 0, -1);
    for (const jobJson of queueJobs) {
      const job = JSON.parse(jobJson);
      if (job.jobId === jobId) {
        return {
          id: jobId,
          state: 'waiting',
          data: job,
          createdAt: job.createdAt,
        };
      }
    }

    return null;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const queueLength = await this.redisService.zcard(this.queueKey);
    const processingKeys = await this.redisService.keys(
      `${this.processingKey}:*`
    );
    const processingCount = processingKeys.length;

    return {
      waiting: queueLength,
      active: processingCount,
      total: queueLength + processingCount,
    };
  }

  /**
   * Start the job processor (runs in background)
   */
  private startJobProcessor(): void {
    setInterval(async () => {
      try {
        await this.processNextJob();
      } catch (error) {
        this.logger.error('Error in job processor:', error);
      }
    }, 2000); // Process every 2 seconds

    this.logger.log('Match analysis job processor started');
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    const jobs = await this.redisService.zrevrange(this.queueKey, 0, 0); // Get highest priority job

    if (jobs.length === 0) {
      return; // No jobs to process
    }

    const jobJson = jobs[0];
    const job: MatchAnalysisJobData & { jobId: string } = JSON.parse(jobJson);

    // Mark job as processing
    await this.redisService.set(
      `${this.processingKey}:${job.jobId}`,
      jobJson,
      300 // Expire after 5 minutes
    );

    // Remove from queue
    await this.redisService.zrem(this.queueKey, jobJson);

    try {
      this.logger.log(`Processing job ${job.jobId} for match ${job.matchId}`);

      // Process the job using the MatchAnalysisProcessor
      await this.processJob(job);

      // Clean up processing marker
      await this.redisService.del(`${this.processingKey}:${job.jobId}`);

      this.logger.log(`Completed job ${job.jobId}`);
    } catch (error) {
      this.logger.error(`Failed job ${job.jobId}:`, error);
      // Move to failed queue or retry logic could be added here
      await this.redisService.del(`${this.processingKey}:${job.jobId}`);
    }
  }

  /**
   * Process job using the MatchAnalysisProcessor
   */
  private async processJob(job: MatchAnalysisJobData): Promise<void> {
    await this.matchAnalysisProcessor.processJob(job);
  }

  /**
   * Clean up old jobs
   */
  private async cleanupOldJobs(): Promise<void> {
    try {
      // Clean up expired processing jobs
      const processingKeys = await this.redisService.keys(
        `${this.processingKey}:*`
      );
      for (const key of processingKeys) {
        const ttl = await this.redisService.ttl(key);
        if (ttl <= 0) {
          await this.redisService.del(key);
        }
      }

      this.logger.log('Cleaned up old processing jobs');
    } catch (error) {
      this.logger.error('Failed to cleanup old jobs:', error);
    }
  }
}
