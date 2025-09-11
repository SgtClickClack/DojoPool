import { ContentType } from '@dojopool/types';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { LOMSService } from '../loms.service';

describe('LOMSService', () => {
  let service: LOMSService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    content: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    promotion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    newsItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    assetBundle: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LOMSService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LOMSService>(LOMSService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const createEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        eventType: 'TOURNAMENT',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-02T00:00:00Z',
        priority: 1,
        targetAudience: ['ALL'],
        rewards: { coins: 100 },
        requirements: { minLevel: 1 },
        tags: ['test'],
      };

      const mockContent = {
        id: 'content-1',
        title: 'Test Event',
        description: 'Test Description',
        contentType: ContentType.EVENT,
        status: 'APPROVED',
        visibility: 'PUBLIC',
        userId: 'admin-1',
        metadata: JSON.stringify({
          eventType: 'TOURNAMENT',
          startTime: '2024-01-01T00:00:00Z',
          endTime: '2024-01-02T00:00:00Z',
          rewards: { coins: 100 },
          requirements: { minLevel: 1 },
        }),
        tags: JSON.stringify(['test']),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'admin-1', username: 'admin' },
      };

      const mockEvent = {
        id: 'event-1',
        contentId: 'content-1',
        eventType: 'TOURNAMENT',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-02T00:00:00Z'),
        isActive: true,
        priority: 1,
        targetAudience: ['ALL'],
        rewards: { coins: 100 },
        requirements: { minLevel: 1 },
        createdBy: 'admin-1',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: mockContent,
      };

      mockPrismaService.content.create.mockResolvedValue(mockContent);
      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.createEvent(createEventDto, 'admin-1');

      expect(mockPrismaService.content.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Event',
          description: 'Test Description',
          contentType: ContentType.EVENT,
          status: 'APPROVED',
          visibility: 'PUBLIC',
          userId: 'admin-1',
        }),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentId: 'content-1',
          eventType: 'TOURNAMENT',
          startTime: new Date('2024-01-01T00:00:00Z'),
          endTime: new Date('2024-01-02T00:00:00Z'),
          priority: 1,
          targetAudience: ['ALL'],
          rewards: { coins: 100 },
          requirements: { minLevel: 1 },
          createdBy: 'admin-1',
        }),
        include: {
          content: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      expect(result).toEqual(mockEvent);
    });

    it('should handle event creation without optional fields', async () => {
      const createEventDto = {
        title: 'Simple Event',
        eventType: 'SPECIAL_EVENT',
        startTime: '2024-01-01T00:00:00Z',
      };

      const mockContent = {
        id: 'content-2',
        title: 'Simple Event',
        description: null,
        contentType: ContentType.EVENT,
        status: 'APPROVED',
        visibility: 'PUBLIC',
        userId: 'admin-1',
        metadata: JSON.stringify({
          eventType: 'SPECIAL_EVENT',
          startTime: '2024-01-01T00:00:00Z',
          endTime: null,
          rewards: {},
          requirements: {},
        }),
        tags: JSON.stringify([]),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'admin-1', username: 'admin' },
      };

      const mockEvent = {
        id: 'event-2',
        contentId: 'content-2',
        eventType: 'SPECIAL_EVENT',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: null,
        isActive: true,
        priority: 1,
        targetAudience: [],
        rewards: {},
        requirements: {},
        createdBy: 'admin-1',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: mockContent,
      };

      mockPrismaService.content.create.mockResolvedValue(mockContent);
      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.createEvent(createEventDto, 'admin-1');

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          endTime: null,
          targetAudience: [],
          rewards: {},
          requirements: {},
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAllEvents', () => {
    it('should return paginated events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          contentId: 'content-1',
          eventType: 'TOURNAMENT',
          startTime: new Date(),
          endTime: new Date(),
          isActive: true,
          priority: 1,
          targetAudience: ['ALL'],
          rewards: {},
          requirements: {},
          createdBy: 'admin-1',
          content: {
            id: 'content-1',
            title: 'Test Event',
            description: 'Test Description',
            user: { id: 'admin-1', username: 'admin' },
          },
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.event.count.mockResolvedValue(1);

      const result = await service.findAllEvents({ page: 1, limit: 10 });

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          content: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { startTime: 'desc' }],
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        events: mockEvents,
        totalCount: 1,
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should filter events by active status', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);

      await service.findAllEvents({ isActive: true });

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Object),
        orderBy: expect.any(Array),
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOneEvent', () => {
    it('should return a single event', async () => {
      const mockEvent = {
        id: 'event-1',
        contentId: 'content-1',
        eventType: 'TOURNAMENT',
        startTime: new Date(),
        endTime: new Date(),
        isActive: true,
        priority: 1,
        targetAudience: ['ALL'],
        rewards: {},
        requirements: {},
        createdBy: 'admin-1',
        content: {
          id: 'content-1',
          title: 'Test Event',
          description: 'Test Description',
          user: { id: 'admin-1', username: 'admin' },
        },
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOneEvent('event-1');

      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        include: {
          content: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException for non-existent event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.findOneEvent('non-existent')).rejects.toThrow(
        'Event not found'
      );
    });
  });

  describe('updateEvent', () => {
    it('should update an event successfully', async () => {
      const existingEvent = {
        id: 'event-1',
        contentId: 'content-1',
        eventType: 'TOURNAMENT',
        startTime: new Date(),
        endTime: new Date(),
        isActive: true,
        priority: 1,
        targetAudience: ['ALL'],
        rewards: {},
        requirements: {},
        createdBy: 'admin-1',
        content: {
          id: 'content-1',
          title: 'Old Title',
          description: 'Old Description',
          metadata: JSON.stringify({}),
          tags: JSON.stringify([]),
        },
      };

      const updateEventDto = {
        title: 'Updated Event',
        description: 'Updated Description',
        eventType: 'SPECIAL_EVENT',
        startTime: '2024-01-02T00:00:00Z',
        endTime: '2024-01-03T00:00:00Z',
        priority: 2,
        isActive: false,
        tags: ['updated'],
      };

      const updatedEvent = {
        ...existingEvent,
        eventType: 'SPECIAL_EVENT',
        startTime: new Date('2024-01-02T00:00:00Z'),
        endTime: new Date('2024-01-03T00:00:00Z'),
        priority: 2,
        isActive: false,
        updatedBy: 'admin-2',
        updatedAt: new Date(),
        content: {
          ...existingEvent.content,
          title: 'Updated Event',
          description: 'Updated Description',
          metadata: JSON.stringify({
            eventType: 'SPECIAL_EVENT',
            startTime: '2024-01-02T00:00:00Z',
            endTime: '2024-01-03T00:00:00Z',
            rewards: {},
            requirements: {},
          }),
          tags: JSON.stringify(['updated']),
        },
      };

      mockPrismaService.event.findUnique.mockResolvedValue(existingEvent);
      mockPrismaService.content.update.mockResolvedValue(updatedEvent.content);
      mockPrismaService.event.update.mockResolvedValue(updatedEvent);

      const result = await service.updateEvent(
        'event-1',
        updateEventDto,
        'admin-2'
      );

      expect(mockPrismaService.content.update).toHaveBeenCalledWith({
        where: { id: 'content-1' },
        data: expect.objectContaining({
          title: 'Updated Event',
          description: 'Updated Description',
        }),
      });

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: expect.objectContaining({
          eventType: 'SPECIAL_EVENT',
          startTime: new Date('2024-01-02T00:00:00Z'),
          endTime: new Date('2024-01-03T00:00:00Z'),
          priority: 2,
          isActive: false,
          updatedBy: 'admin-2',
          updatedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });

      expect(result).toEqual(updatedEvent);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event successfully', async () => {
      const mockEvent = {
        id: 'event-1',
        contentId: 'content-1',
        content: { id: 'content-1', title: 'Test Event' },
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.delete.mockResolvedValue(mockEvent);

      const result = await service.deleteEvent('event-1', 'admin-1');

      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('createPromotion', () => {
    it('should create a promotion successfully', async () => {
      const createPromotionDto = {
        title: 'Test Promotion',
        description: 'Test Description',
        code: 'TEST10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minPurchase: 50,
        maxUses: 100,
        isActive: true,
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-12-31T00:00:00Z',
        targetUsers: ['ALL'],
        applicableItems: ['ALL'],
        tags: ['test'],
      };

      const mockContent = {
        id: 'content-1',
        title: 'Test Promotion',
        description: 'Test Description',
        contentType: ContentType.PROMOTION,
        status: 'APPROVED',
        visibility: 'PUBLIC',
        userId: 'admin-1',
        metadata: JSON.stringify({
          code: 'TEST10',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minPurchase: 50,
          maxUses: 100,
        }),
        tags: JSON.stringify(['test']),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'admin-1', username: 'admin' },
      };

      const mockPromotion = {
        id: 'promotion-1',
        contentId: 'content-1',
        code: 'TEST10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minPurchase: 50,
        maxUses: 100,
        usedCount: 0,
        isActive: true,
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-12-31T00:00:00Z'),
        targetUsers: ['ALL'],
        applicableItems: ['ALL'],
        createdBy: 'admin-1',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: mockContent,
      };

      mockPrismaService.content.create.mockResolvedValue(mockContent);
      mockPrismaService.promotion.create.mockResolvedValue(mockPromotion);

      const result = await service.createPromotion(
        createPromotionDto,
        'admin-1'
      );

      expect(result).toEqual(mockPromotion);
      expect(mockPrismaService.content.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Promotion',
          contentType: ContentType.PROMOTION,
          status: 'APPROVED',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('getLiveContent', () => {
    it('should return active live content', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 86400000); // 24 hours from now

      const mockEvents = [
        {
          id: 'event-1',
          contentId: 'content-1',
          eventType: 'TOURNAMENT',
          startTime: now,
          endTime: futureDate,
          isActive: true,
          priority: 1,
          targetAudience: ['ALL'],
          rewards: { coins: 100 },
          requirements: {},
          createdBy: 'admin-1',
          content: {
            id: 'content-1',
            title: 'Active Tournament',
            description: 'An active tournament',
            userId: 'admin-1',
          },
        },
      ];

      const mockPromotions = [
        {
          id: 'promotion-1',
          contentId: 'content-2',
          code: 'ACTIVE10',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          isActive: true,
          startTime: now,
          endTime: futureDate,
          usedCount: 0,
          content: {
            id: 'content-2',
            title: 'Active Promotion',
            description: 'An active promotion',
            userId: 'admin-1',
          },
        },
      ];

      const mockNews = [
        {
          id: 'news-1',
          contentId: 'content-3',
          category: 'UPDATE',
          priority: 1,
          isPublished: true,
          publishTime: now,
          readCount: 0,
          content: {
            id: 'content-3',
            title: 'Published News',
            description: 'Published news item',
            userId: 'admin-1',
          },
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.promotion.findMany.mockResolvedValue(mockPromotions);
      mockPrismaService.newsItem.findMany.mockResolvedValue(mockNews);

      const result = await service.getLiveContent();

      expect(result).toEqual({
        events: mockEvents,
        promotions: mockPromotions,
        news: mockNews,
        lastUpdated: expect.any(Date),
      });

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          startTime: { lte: expect.any(Date) },
          OR: [{ endTime: null }, { endTime: { gte: expect.any(Date) } }],
        },
        include: { content: true },
        orderBy: { priority: 'desc' },
      });
    });

    it('should filter promotions by active status and time range', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000); // 24 hours ago
      const futureDate = new Date(now.getTime() + 86400000); // 24 hours from now

      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.promotion.findMany.mockResolvedValue([]);
      mockPrismaService.newsItem.findMany.mockResolvedValue([]);

      await service.getLiveContent();

      expect(mockPrismaService.promotion.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [{ startTime: null }, { startTime: { lte: expect.any(Date) } }],
          OR: [{ endTime: null }, { endTime: { gte: expect.any(Date) } }],
        },
        include: { content: true },
      });
    });
  });
});
