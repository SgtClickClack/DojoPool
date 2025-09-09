import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { InsightsService } from './insights.service';

describe('InsightsService', () => {
  let service: InsightsService;
  let mockPrisma: any;
  let mockAiService: any;

  const mockMatch = {
    id: 'match-123',
    scoreA: 5,
    scoreB: 3,
    winnerId: 'player-a',
    round: 1,
    playerA: { username: 'PlayerA' },
    playerB: { username: 'PlayerB' },
    tournament: { name: 'Test Tournament' },
    venue: { name: 'Test Venue' },
  };

  const mockAiResponse = {
    provider: 'gemini',
    fallback: false,
    data: {
      keyMoments: ['Great opening shot', 'Defensive masterclass'],
      strategicInsights: ['Strong positioning', 'Good shot selection'],
      playerPerformance: {
        playerA: 'Excellent consistency and positioning',
        playerB: 'Good defense but needs work on offense',
      },
      overallAssessment: 'A well-played match with strategic depth',
      recommendations: ['Practice bank shots', 'Work on speed control'],
    },
  };

  const mockMatchAnalysis = {
    id: 'analysis-123',
    matchId: 'match-123',
    provider: 'gemini',
    fallback: false,
    keyMoments: ['Great opening shot', 'Defensive masterclass'],
    strategicInsights: ['Strong positioning', 'Good shot selection'],
    playerPerformanceA: 'Excellent consistency and positioning',
    playerPerformanceB: 'Good defense but needs work on offense',
    overallAssessment: 'A well-played match with strategic depth',
    recommendations: ['Practice bank shots', 'Work on speed control'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrisma = {
      match: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      matchAnalysis: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    mockAiService = {
      generateMatchAnalysis: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    service = module.get<InsightsService>(InsightsService);

    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMatchInsights', () => {
    it('should return existing analysis if found', async () => {
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(mockMatchAnalysis);

      const result = await service.getMatchInsights('match-123');

      expect(result).toEqual(mockMatchAnalysis);
      expect(mockPrisma.matchAnalysis.findUnique).toHaveBeenCalledWith({
        where: { matchId: 'match-123' },
      });
      expect(mockPrisma.match.findUnique).not.toHaveBeenCalled();
    });

    it('should generate new analysis if none exists', async () => {
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(null);
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);
      mockAiService.generateMatchAnalysis.mockResolvedValue(mockAiResponse);
      mockPrisma.matchAnalysis.create.mockResolvedValue(mockMatchAnalysis);

      const result = await service.getMatchInsights('match-123');

      expect(result).toEqual(mockMatchAnalysis);
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
    });

    it('should throw NotFoundException if match not found', async () => {
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(null);
      mockPrisma.match.findUnique.mockResolvedValue(null);

      await expect(service.getMatchInsights('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle AI service fallback', async () => {
      const fallbackResponse = { ...mockAiResponse, fallback: true };
      mockPrisma.matchAnalysis.findUnique.mockResolvedValue(null);
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);
      mockAiService.generateMatchAnalysis.mockResolvedValue(fallbackResponse);
      mockPrisma.matchAnalysis.create.mockResolvedValue({
        ...mockMatchAnalysis,
        fallback: true,
      });

      const result = await service.getMatchInsights('match-123');

      expect(result.fallback).toBe(true);
    });
  });

  describe('getPlayerInsights', () => {
    const mockMatches = [
      { winnerId: 'player-123', id: 'match1' },
      { winnerId: 'player-123', id: 'match2' },
      { winnerId: 'other-player', id: 'match3' },
      { winnerId: 'player-123', id: 'match4' },
    ];

    it('should calculate player insights correctly', async () => {
      mockPrisma.match.findMany.mockResolvedValue(mockMatches);

      const result = await service.getPlayerInsights('player-123');

      expect(result.playerId).toBe('player-123');
      expect(result.summary.totalMatches).toBe(4);
      expect(result.summary.wins).toBe(3);
      expect(result.summary.losses).toBe(1);
      expect(result.summary.winRate).toBe(75);

      expect(mockPrisma.match.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ playerAId: 'player-123' }, { playerBId: 'player-123' }],
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('should handle player with no matches', async () => {
      mockPrisma.match.findMany.mockResolvedValue([]);

      const result = await service.getPlayerInsights('new-player');

      expect(result.summary.totalMatches).toBe(0);
      expect(result.summary.wins).toBe(0);
      expect(result.summary.losses).toBe(0);
      expect(result.summary.winRate).toBe(0);
    });

    it('should limit results to 100 matches', async () => {
      const manyMatches = Array.from({ length: 150 }, (_, i) => ({
        winnerId: 'player-123',
        id: `match${i}`,
      }));
      mockPrisma.match.findMany.mockResolvedValue(manyMatches);

      await service.getPlayerInsights('player-123');

      expect(mockPrisma.match.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });
});
