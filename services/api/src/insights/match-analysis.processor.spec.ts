import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MatchAnalysisProcessor } from './match-analysis.processor';

describe('MatchAnalysisProcessor', () => {
  let processor: MatchAnalysisProcessor;
  let mockAiService: any;
  let mockPrisma: any;
  let mockRedisService: any;

  const mockJobData = {
    jobId: 'job-123',
    matchId: 'match-123',
    playerAId: 'player-a',
    playerBId: 'player-b',
    priority: 'normal' as const,
    createdAt: Date.now(),
  };

  const mockMatch = {
    id: 'match-123',
    scoreA: 5,
    scoreB: 3,
    winnerId: 'player-a',
    round: 1,
    playerA: { username: 'PlayerA', id: 'player-a' },
    playerB: { username: 'PlayerB', id: 'player-b' },
    tournament: { name: 'Test Tournament' },
    venue: { name: 'Test Venue' },
  };

  const mockAiResponse = {
    provider: 'gemini',
    fallback: false,
    data: {
      keyMoments: ['Great opening shot'],
      strategicInsights: ['Strong positioning'],
      playerPerformance: {
        playerA: 'Excellent play',
        playerB: 'Good defense',
      },
      overallAssessment: 'Well-played match',
      recommendations: ['Practice more'],
    },
  };

  beforeEach(async () => {
    mockAiService = {
      generateMatchAnalysis: jest.fn(),
    };

    mockPrisma = {
      match: {
        findUnique: jest.fn(),
      },
      matchAnalysis: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchAnalysisProcessor,
        {
          provide: AiService,
          useValue: mockAiService,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    processor = module.get<MatchAnalysisProcessor>(MatchAnalysisProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('processJob', () => {
    it('should process a match analysis job successfully', async () => {
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(null);
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);
      mockAiService.generateMatchAnalysis.mockResolvedValue(mockAiResponse);
      mockPrisma.matchAnalysis.create.mockResolvedValue({
        id: 'analysis-123',
        matchId: 'match-123',
        ...mockAiResponse.data,
        provider: mockAiResponse.provider,
        fallback: mockAiResponse.fallback,
      });

      const result = await processor.processJob(mockJobData);

      expect(result).toBeDefined();
      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-123' },
        include: expect.any(Object),
      });
      expect(mockAiService.generateMatchAnalysis).toHaveBeenCalledWith({
        playerAName: 'PlayerA',
        playerBName: 'PlayerB',
        scoreA: 5,
        scoreB: 3,
        winner: 'Player A',
        shots: [],
        venue: 'Test Venue',
        round: 1,
      });
      expect(mockPrisma.matchAnalysis.create).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return existing analysis if already processed', async () => {
      const existingAnalysis = {
        id: 'analysis-123',
        matchId: 'match-123',
        keyMoments: ['Existing analysis'],
      };

      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(existingAnalysis);

      const result = await processor.processJob(mockJobData);

      expect(result).toEqual(existingAnalysis);
      expect(mockPrisma.match.findUnique).not.toHaveBeenCalled();
      expect(mockAiService.generateMatchAnalysis).not.toHaveBeenCalled();
    });

    it('should handle match not found error', async () => {
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(null);
      mockPrisma.match.findUnique.mockResolvedValue(null);

      await expect(processor.processJob(mockJobData)).rejects.toThrow(
        'Match match-123 not found'
      );
    });

    it('should handle AI service errors', async () => {
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(null);
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);
      mockAiService.generateMatchAnalysis.mockRejectedValue(
        new Error('AI service unavailable')
      );

      await expect(processor.processJob(mockJobData)).rejects.toThrow(
        'AI service unavailable'
      );
    });

    it('should handle fallback AI responses', async () => {
      const fallbackResponse = { ...mockAiResponse, fallback: true };
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(null);
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);
      mockAiService.generateMatchAnalysis.mockResolvedValue(fallbackResponse);
      mockPrisma.matchAnalysis.create.mockResolvedValue({
        id: 'analysis-123',
        fallback: true,
      });

      const result = await processor.processJob(mockJobData);

      expect(result.fallback).toBe(true);
      expect(mockPrisma.matchAnalysis.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fallback: true,
          }),
        })
      );
    });
  });

  describe('getExistingAnalysis', () => {
    it('should return cached analysis if available', async () => {
      const cachedAnalysis = { id: 'cached-123', matchId: 'match-123' };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedAnalysis));

      const result = await processor.getExistingAnalysis('match-123');

      expect(result).toEqual(cachedAnalysis);
      expect(mockPrisma.matchAnalysis.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const dbAnalysis = { id: 'db-123', matchId: 'match-123' };
      mockRedisService.get.mockResolvedValue(null);
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(dbAnalysis);

      const result = await processor.getExistingAnalysis('match-123');

      expect(result).toEqual(dbAnalysis);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'match-analysis:match-123',
        JSON.stringify(dbAnalysis),
        3600
      );
    });

    it('should return null if no analysis exists', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(null);

      const result = await processor.getExistingAnalysis('match-123');

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisService.get.mockRejectedValue(new Error('Redis error'));
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(null);

      const result = await processor.getExistingAnalysis('match-123');

      expect(result).toBeNull();
    });
  });
});
