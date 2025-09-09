import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { MatchmakingService } from '../matchmaking.service';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      upsert: jest.fn(),
    },
    match: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    table: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    zadd: jest.fn(),
    zrem: jest.fn(),
    zrank: jest.fn(),
    zrange: jest.fn(),
    zrangebyscore: jest.fn(),
    zcard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('joinQueue', () => {
    it('should successfully join queue for valid user', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        username: 'testuser',
        profile: {
          skillRating: 1500,
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockRedisService.get.mockResolvedValue(null); // Not in queue
      mockRedisService.set.mockResolvedValue('OK');
      mockRedisService.zadd.mockResolvedValue(1);

      const result = await service.joinQueue(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: {
          profile: true,
        },
      });

      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockRedisService.zadd).toHaveBeenCalledWith(
        'matchmaking:queue:sorted',
        1500,
        userId
      );

      expect(result).toEqual({
        success: true,
        estimatedWaitTime: expect.any(Number),
      });
    });

    it('should throw error if user is already in queue', async () => {
      const userId = 'user-1';

      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          userId,
          joinedAt: new Date(),
        })
      );

      await expect(service.joinQueue(userId)).rejects.toThrow(
        'User is already in matchmaking queue'
      );
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-user';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.joinQueue(userId)).rejects.toThrow('User not found');
    });
  });

  describe('leaveQueue', () => {
    it('should successfully leave queue', async () => {
      const userId = 'user-1';

      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          userId,
          joinedAt: new Date(),
        })
      );
      mockRedisService.del.mockResolvedValue(1);
      mockRedisService.zrem.mockResolvedValue(1);

      const result = await service.leaveQueue(userId);

      expect(mockRedisService.del).toHaveBeenCalledWith(
        `matchmaking:queue:${userId}`
      );
      expect(mockRedisService.zrem).toHaveBeenCalledWith(
        'matchmaking:queue:sorted',
        userId
      );
      expect(result).toEqual({ success: true });
    });

    it('should return false if user not in queue', async () => {
      const userId = 'user-1';

      mockRedisService.get.mockResolvedValue(null);

      const result = await service.leaveQueue(userId);

      expect(result).toEqual({ success: false });
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status for user in queue', async () => {
      const userId = 'user-1';
      const queueEntry = {
        userId,
        skillRating: 1500,
        joinedAt: new Date(),
      };

      mockRedisService.get.mockResolvedValue(JSON.stringify(queueEntry));
      mockRedisService.zrank.mockResolvedValue(5);

      const result = await service.getQueueStatus(userId);

      expect(result).toEqual({
        inQueue: true,
        estimatedWaitTime: expect.any(Number),
        position: 6, // Redis is 0-indexed, so 5 becomes 6
      });
    });

    it('should return not in queue for user not in queue', async () => {
      const userId = 'user-1';

      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getQueueStatus(userId);

      expect(result).toEqual({ inQueue: false });
    });
  });

  describe('findMatch', () => {
    beforeEach(() => {
      mockPrismaService.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'user-1') {
          return Promise.resolve({ username: 'player1' });
        } else if (where.id === 'user-2') {
          return Promise.resolve({ username: 'player2' });
        }
        return Promise.resolve(null);
      });
    });

    it('should find a suitable match within search range', async () => {
      const userId = 'user-1';
      const skillRating = 1500;

      mockRedisService.zrangebyscore.mockResolvedValue([
        'user-2',
        '1520', // user-2 with rating 1520
      ]);

      const result = await service['findMatch'](userId, skillRating, 100);

      expect(mockRedisService.zrangebyscore).toHaveBeenCalledWith(
        'matchmaking:queue:sorted',
        1400, // 1500 - 100
        1600, // 1500 + 100
        'WITHSCORES'
      );

      expect(result).toEqual({
        player1: {
          id: userId,
          skillRating: 1500,
          username: 'player1',
        },
        player2: {
          id: 'user-2',
          skillRating: 1520,
          username: 'player2',
        },
      });
    });

    it('should return null if no suitable match found', async () => {
      const userId = 'user-1';
      const skillRating = 1500;

      mockRedisService.zrangebyscore.mockResolvedValue([]);

      const result = await service['findMatch'](userId, skillRating, 100);

      expect(result).toBeNull();
    });

    it('should skip self when finding matches', async () => {
      const userId = 'user-1';
      const skillRating = 1500;

      mockRedisService.zrangebyscore.mockResolvedValue([
        'user-1',
        '1500', // Same user
        'user-2',
        '1520', // Different user
      ]);

      const result = await service['findMatch'](userId, skillRating, 100);

      expect(result).toEqual({
        player1: {
          id: userId,
          skillRating: 1500,
          username: 'player1',
        },
        player2: {
          id: 'user-2',
          skillRating: 1520,
          username: 'player2',
        },
      });
    });
  });

  describe('calculateEloChange', () => {
    it('should calculate ELO change for player A win', () => {
      const ratingA = 1500;
      const ratingB = 1400;
      const playerAWon = true;

      const result = service['calculateEloChange'](
        ratingA,
        ratingB,
        playerAWon
      );

      expect(result.eloChangeA).toBeGreaterThan(0);
      expect(result.eloChangeB).toBeLessThan(0);
      expect(result.eloChangeA).toBe(-result.eloChangeB);
    });

    it('should calculate ELO change for player B win', () => {
      const ratingA = 1500;
      const ratingB = 1400;
      const playerAWon = false;

      const result = service['calculateEloChange'](
        ratingA,
        ratingB,
        playerAWon
      );

      expect(result.eloChangeA).toBeLessThan(0);
      expect(result.eloChangeB).toBeGreaterThan(0);
      expect(result.eloChangeA).toBe(-result.eloChangeB);
    });

    it('should give smaller rating change for evenly matched players', () => {
      const ratingA = 1500;
      const ratingB = 1500;
      const playerAWon = true;

      const result = service['calculateEloChange'](
        ratingA,
        ratingB,
        playerAWon
      );

      // For evenly matched players, expected score is 0.5, so change should be smaller
      expect(Math.abs(result.eloChangeA)).toBeLessThan(20); // Less than full K-factor
    });

    it('should give larger rating change for mismatched players', () => {
      const ratingA = 1600;
      const ratingB = 1400;
      const playerAWon = true;

      const result = service['calculateEloChange'](
        ratingA,
        ratingB,
        playerAWon
      );

      // For mismatched players, expected score favors higher rated player
      expect(Math.abs(result.eloChangeA)).toBeGreaterThan(25);
    });
  });

  describe('submitMatchResult', () => {
    const mockMatch = {
      id: 'match-1',
      playerAId: 'player-a',
      playerBId: 'player-b',
      playerA: {
        profile: { skillRating: 1500 },
      },
      playerB: {
        profile: { skillRating: 1400 },
      },
    };

    it('should submit match result and update ratings', async () => {
      const matchId = 'match-1';
      const winnerId = 'player-a';
      const scoreA = 10;
      const scoreB = 5;

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.match.update.mockResolvedValue(mockMatch);
      mockPrismaService.profile.upsert.mockResolvedValue({} as any);

      await service.submitMatchResult(matchId, winnerId, scoreA, scoreB);

      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({
        where: { id: matchId },
        include: {
          playerA: {
            include: { profile: true },
          },
          playerB: {
            include: { profile: true },
          },
        },
      });

      expect(mockPrismaService.match.update).toHaveBeenCalledTimes(2); // Update match result and ELO changes
      expect(mockPrismaService.profile.upsert).toHaveBeenCalledTimes(2); // Update both players' ratings
    });

    it('should throw error if match not found', async () => {
      const matchId = 'non-existent-match';

      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(
        service.submitMatchResult(matchId, 'winner', 10, 5)
      ).rejects.toThrow('Match not found');
    });

    it('should throw error if match is not in progress', async () => {
      const matchId = 'match-1';
      const mockCompletedMatch = {
        ...mockMatch,
        status: 'COMPLETED',
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockCompletedMatch);

      await expect(
        service.submitMatchResult(matchId, 'winner', 10, 5)
      ).rejects.toThrow('Match is not in progress');
    });
  });

  describe('getStatistics', () => {
    it('should return matchmaking statistics', async () => {
      const mockMatches = [
        { id: 'match-1', createdAt: new Date() },
        { id: 'match-2', createdAt: new Date() },
      ];

      mockRedisService.zcard.mockResolvedValue(15);
      mockPrismaService.match.findMany.mockResolvedValue(mockMatches);
      mockPrismaService.match.count.mockResolvedValue(5);

      const result = await service.getStatistics();

      expect(mockRedisService.zcard).toHaveBeenCalledWith(
        'matchmaking:queue:sorted'
      );
      expect(mockPrismaService.match.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expect.any(Date),
          },
          isRanked: true,
        },
      });

      expect(result).toEqual({
        queueSize: 15,
        averageWaitTime: 180,
        matchesCreated: 2,
        activeMatches: 5,
      });
    });
  });
});
