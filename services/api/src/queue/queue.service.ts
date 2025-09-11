import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

export interface JobData {
  id: string;
  type: string;
  payload: any;
  metadata?: Record<string, any>;
}

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queues: {
    ai: {
      name: string;
      concurrency: number;
    };
    batch: {
      name: string;
      concurrency: number;
    };
    analytics: {
      name: string;
      concurrency: number;
    };
  };
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private redisClient!: IORedis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private config: QueueConfig;

  constructor(private configService: ConfigService) {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): QueueConfig {
    const get = this.configService?.get.bind(this.configService) as
      | ((key: string) => any)
      | undefined;

    return {
      redis: {
        host: get?.('REDIS_HOST') || 'localhost',
        port: get?.('REDIS_PORT') || 6379,
        password: get?.('REDIS_PASSWORD'),
        db: get?.('REDIS_DB') || 0,
      },
      queues: {
        ai: {
          name: 'ai-analysis',
          concurrency: get?.('AI_QUEUE_CONCURRENCY') || 3,
        },
        batch: {
          name: 'batch-updates',
          concurrency: get?.('BATCH_QUEUE_CONCURRENCY') || 2,
        },
        analytics: {
          name: 'analytics-processing',
          concurrency: get?.('ANALYTICS_QUEUE_CONCURRENCY') || 2,
        },
      },
    };
  }

  async onModuleInit() {
    try {
      // Initialize Redis client
      this.redisClient = new IORedis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Test Redis connection
      await this.redisClient.ping();
      this.logger.log('Connected to Redis for job queues');

      // Initialize queues
      await this.initializeQueues();

      this.logger.log('Queue service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize queue service:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      // Close all workers
      for (const [name, worker] of this.workers) {
        await worker.close();
        this.logger.log(`Closed worker for queue: ${name}`);
      }

      // Note: Schedulers are no longer used in this version

      // Close all queues
      for (const [name, queue] of this.queues) {
        await queue.close();
        this.logger.log(`Closed queue: ${name}`);
      }

      // Close Redis client
      if (this.redisClient) {
        await this.redisClient.quit();
        this.logger.log('Redis connection closed');
      }
    } catch (error) {
      this.logger.error('Error during queue service cleanup:', error);
    }
  }

  private async initializeQueues() {
    const queueConfigs = Object.values(this.config.queues);

    for (const config of queueConfigs) {
      // Create queue
      const queue = new Queue(config.name, {
        connection: {
          host: this.config.redis.host,
          port: this.config.redis.port,
          password: this.config.redis.password,
          db: this.config.redis.db,
        },
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      });

      this.queues.set(config.name, queue);

      // Create scheduler for delayed jobs
      // Note: Schedulers are not used in this version of BullMQ

      this.logger.log(`Initialized queue: ${config.name}`);
    }
  }

  /**
   * Add a job to a specific queue
   */
  async addJob(
    queueName: string,
    jobData: JobData,
    options: JobsOptions = {}
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.add(jobData.type, jobData, {
        jobId: jobData.id,
        ...options,
      });

      this.logger.log(`Added job ${job.id || 'unknown'} to queue ${queueName}`);
      return job.id || '';
    } catch (error) {
      this.logger.error(`Failed to add job to queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Add a job to the AI analysis queue
   */
  async addAIAnalysisJob(
    jobData: Omit<JobData, 'id'>,
    options: JobsOptions = {}
  ): Promise<string> {
    const jobId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return this.addJob(
      this.config.queues.ai.name,
      { ...jobData, id: jobId },
      options
    );
  }

  /**
   * Add a job to the batch updates queue
   */
  async addBatchUpdateJob(
    jobData: Omit<JobData, 'id'>,
    options: JobsOptions = {}
  ): Promise<string> {
    const jobId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return this.addJob(
      this.config.queues.batch.name,
      { ...jobData, id: jobId },
      options
    );
  }

  /**
   * Add a job to the analytics processing queue
   */
  async addAnalyticsJob(
    jobData: Omit<JobData, 'id'>,
    options: JobsOptions = {}
  ): Promise<string> {
    const jobId = `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return this.addJob(
      this.config.queues.analytics.name,
      { ...jobData, id: jobId },
      options
    );
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats for queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    const stats: Record<string, any> = {};

    for (const [name] of this.queues) {
      try {
        stats[name] = await this.getQueueStats(name);
      } catch (error) {
        stats[name] = { error: error.message };
      }
    }

    return stats;
  }

  /**
   * Register a worker for a specific queue
   */
  registerWorker(queueName: string, processor: (job: any) => Promise<void>) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const config = Object.values(this.config.queues).find(
      (q) => q.name === queueName
    );
    if (!config) {
      throw new Error(`Configuration not found for queue ${queueName}`);
    }

    const worker = new Worker(queueName, processor, {
      connection: {
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
      },
      concurrency: config.concurrency,
    });

    worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed in queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed in queue ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Registered worker for queue: ${queueName}`);
  }

  /**
   * Get a specific queue instance
   */
  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Get configuration
   */
  getConfig(): QueueConfig {
    return { ...this.config };
  }
}
