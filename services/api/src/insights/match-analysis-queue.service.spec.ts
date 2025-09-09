import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis/redis.service';
import { MatchAnalysisQueueService } from './match-analysis-queue.service';
import { MatchAnalysisProcessor } from './match-analysis.processor';

describe('MatchAnalysisQueueService', () => {
  let service: MatchAnalysisQueueService;
  let mockRedisService: any;
  let mockProcessor: any;

  beforeEach(async () => {
    mockRedisService = {
      zadd: jest.fn(),
      zrem: jest.fn(),
      zrevrange: jest.fn(),
      zcard: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ttl: jest.fn(),
    };

    mockProcessor = {
      processJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchAnalysisQueueService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: MatchAnalysisProcessor,
          useValue: mockProcessor,
        },
      ],
    }).compile();

    service = module.get<MatchAnalysisQueueService>(MatchAnalysisQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueMatchAnalysis', () => {
    it('should queue a match analysis job with normal priority', async () => {
      mockRedisService.zadd.mockResolvedValue(true);

      const jobId = await service.queueMatchAnalysis(
        'match-123',
        'player-a',
        'player-b',
        'normal'
      );

      expect(jobId).toMatch(/^match-analysis-match-123-\d+$/);
      expect(mockRedisService.zadd).toHaveBeenCalledWith(
        'match-analysis-queue',
        expect.any(Number),
        expect.stringContaining('"matchId":"match-123"')
      );
    });

    it('should queue a match analysis job with high priority', async () => {
      mockRedisService.zadd.mockResolvedValue(true);

      await service.queueMatchAnalysis(
        'match-123',
        'player-a',
        'player-b',
        'high'
      );

      expect(mockRedisService.zadd).toHaveBeenCalledWith(
        'match-analysis-queue',
        expect.any(Number),
        expect.any(String)
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisService.zadd.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.queueMatchAnalysis('match-123', 'player-a', 'player-b')
      ).rejects.toThrow('Redis error');
    });
  });

  describe('getJobStatus', () => {
    it('should return active status for processing job', async () => {
      const jobData = JSON.stringify({
        jobId: 'job-123',
        matchId: 'match-123',
        createdAt: Date.now(),
      });
      mockRedisService.get.mockResolvedValue(jobData);

      const status = await service.getJobStatus('job-123');

      expect(status).toEqual({
        id: 'job-123',
        state: 'active',
        data: JSON.parse(jobData),
        startedAt: expect.any(Number),
      });
    });

    it('should return waiting status for queued job', async () => {
      const jobData = JSON.stringify({
        jobId: 'job-123',
        matchId: 'match-123',
        createdAt: Date.now(),
      });
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.zrange.mockResolvedValue([jobData]);

      const status = await service.getJobStatus('job-123');

      expect(status).toEqual({
        id: 'job-123',
        state: 'waiting',
        data: JSON.parse(jobData),
        createdAt: expect.any(Number),
      });
    });

    it('should return null for non-existent job', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.zrange.mockResolvedValue([]);

      const status = await service.getJobStatus('nonexistent');

      expect(status).toBeNull();
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockRedisService.zcard.mockResolvedValue(5);
      mockRedisService.keys.mockResolvedValue([
        'processing-job-1',
        'processing-job-2',
      ]);

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        total: 7,
      });
    });

    it('should handle Redis errors in queue stats', async () => {
      mockRedisService.zcard.mockRejectedValue(new Error('Redis error'));
      mockRedisService.keys.mockResolvedValue([]);

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 0,
        active: 0,
        total: 0,
      });
    });
  });

  describe('processNextJob', () => {
    it('should process the next job in queue', async () => {
      const jobData = JSON.stringify({
        jobId: 'job-123',
        matchId: 'match-123',
        playerAId: 'player-a',
        playerBId: 'player-b',
        createdAt: Date.now(),
      });

      mockRedisService.zrevrange.mockResolvedValue([jobData]);
      mockProcessor.processJob.mockResolvedValue({ success: true });

      // Trigger job processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRedisService.zrem).toHaveBeenCalledWith(
        'match-analysis-queue',
        jobData
      );
      expect(mockProcessor.processJob).toHaveBeenCalledWith(
        JSON.parse(jobData)
      );
    });

    it('should handle empty queue', async () => {
      mockRedisService.zrevrange.mockResolvedValue([]);

      // No jobs to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockProcessor.processJob).not.toHaveBeenCalled();
    });
  });
});
