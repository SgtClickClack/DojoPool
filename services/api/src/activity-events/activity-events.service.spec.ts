import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityEventsService } from './activity-events.service';

describe('ActivityEventsService', () => {
  let service: ActivityEventsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    activityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    venue: {
      findMany: jest.fn(),
    },
    clanMember: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityEventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ActivityEventsService>(ActivityEventsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createActivityEvent', () => {
    it('should create an activity event successfully', async () => {
      const mockEventData = {
        type: 'GAME_COMPLETED',
        message: 'Player won a match',
        userId: 'user-1',
        venueId: 'venue-1',
        matchId: 'match-1',
      };

      const mockCreatedEvent = {
        id: 'event-1',
        ...mockEventData,
        data: '{}',
        tournamentId: null,
        clanId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-1', username: 'testuser' },
        venue: { id: 'venue-1', name: 'Test Venue' },
      };

      mockPrismaService.activityEvent.create.mockResolvedValue(
        mockCreatedEvent
      );

      const result = await service.createActivityEvent(mockEventData);

      expect(mockPrismaService.activityEvent.create).toHaveBeenCalledWith({
        data: {
          type: mockEventData.type,
          message: mockEventData.message,
          userId: mockEventData.userId,
          data: '{}',
          venueId: mockEventData.venueId,
          matchId: mockEventData.matchId,
          tournamentId: null,
          clanId: null,
          metadata: null,
        },
        include: {
          user: true,
          venue: true,
        },
      });

      expect(result).toEqual({
        id: mockCreatedEvent.id,
        type: mockCreatedEvent.type,
        message: mockCreatedEvent.message,
        userId: mockCreatedEvent.userId,
        venueId: mockCreatedEvent.venueId,
        matchId: mockCreatedEvent.matchId,
        tournamentId: mockCreatedEvent.tournamentId,
        clanId: mockCreatedEvent.clanId,
        metadata: mockCreatedEvent.metadata,
        createdAt: mockCreatedEvent.createdAt,
        updatedAt: mockCreatedEvent.updatedAt,
      });
    });

    it('should handle metadata JSON parsing', async () => {
      const mockEventData = {
        type: 'TOURNAMENT_WON',
        message: 'Player won tournament',
        userId: 'user-1',
        metadata: '{"prize": 100, "rank": 1}',
      };

      const mockCreatedEvent = {
        id: 'event-2',
        ...mockEventData,
        data: '{}',
        venueId: null,
        matchId: null,
        tournamentId: null,
        clanId: null,
        metadata: { prize: 100, rank: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-1', username: 'testuser' },
        venue: null,
      };

      mockPrismaService.activityEvent.create.mockResolvedValue(
        mockCreatedEvent
      );

      await service.createActivityEvent(mockEventData);

      expect(mockPrismaService.activityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { prize: 100, rank: 1 },
        }),
        include: expect.any(Object),
      });
    });

    it('should handle errors during creation', async () => {
      const mockEventData = {
        type: 'GAME_COMPLETED',
        message: 'Player won a match',
        userId: 'user-1',
      };

      const mockError = new Error('Database connection failed');
      mockPrismaService.activityEvent.create.mockRejectedValue(mockError);

      await expect(service.createActivityEvent(mockEventData)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getActivityFeed', () => {
    it('should return activity feed for user with venues and clans', async () => {
      const userId = 'user-1';
      const mockVenues = [{ id: 'venue-1' }, { id: 'venue-2' }];
      const mockClans = [{ clanId: 'clan-1' }, { clanId: 'clan-2' }];

      const mockEvents = [
        {
          id: 'event-1',
          type: 'GAME_COMPLETED',
          message: 'Player won match',
          userId: 'user-1',
          createdAt: new Date(),
          user: { id: 'user-1', username: 'testuser' },
          venue: { id: 'venue-1', name: 'Test Venue' },
        },
        {
          id: 'event-2',
          type: 'TERRITORY_CAPTURED',
          message: 'Territory claimed',
          userId: 'user-2',
          createdAt: new Date(),
          user: { id: 'user-2', username: 'otheruser' },
          venue: { id: 'venue-1', name: 'Test Venue' },
        },
      ];

      mockPrismaService.venue.findMany.mockResolvedValue(mockVenues);
      mockPrismaService.clanMember.findMany.mockResolvedValue(mockClans);
      mockPrismaService.activityEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getActivityFeed(userId);

      expect(mockPrismaService.venue.findMany).toHaveBeenCalledWith({
        where: { ownerId: userId },
        select: { id: true },
      });

      expect(mockPrismaService.clanMember.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { clanId: true },
      });

      expect(mockPrismaService.activityEvent.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId },
            { venueId: { in: ['venue-1', 'venue-2'] } },
            { clanId: { in: ['clan-1', 'clan-2'] } },
          ],
        },
        include: {
          user: { select: { id: true, username: true } },
          venue: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      expect(result).toEqual(mockEvents);
    });

    it('should handle empty venues and clans', async () => {
      const userId = 'user-1';

      mockPrismaService.venue.findMany.mockResolvedValue([]);
      mockPrismaService.clanMember.findMany.mockResolvedValue([]);
      mockPrismaService.activityEvent.findMany.mockResolvedValue([]);

      const result = await service.getActivityFeed(userId);

      expect(mockPrismaService.activityEvent.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userId }, { venueId: { in: [] } }, { clanId: { in: [] } }],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      expect(result).toEqual([]);
    });

    it('should handle errors during feed retrieval', async () => {
      const userId = 'user-1';
      const mockError = new Error('Database query failed');

      mockPrismaService.venue.findMany.mockRejectedValue(mockError);

      await expect(service.getActivityFeed(userId)).rejects.toThrow(
        'Database query failed'
      );
    });
  });
});
