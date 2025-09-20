import { Test, TestingModule } from '@nestjs/testing';
import { CacheHelper } from '../../cache/cache.helper';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunityService } from '../community.service';

describe('CommunityService', () => {
  let service: CommunityService;
  let prismaService: PrismaService;
  let notificationsService: NotificationsService;

  const mockPrismaService = {
    communityCosmeticItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    cosmeticItemLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCacheHelper = {
    // Mock cache methods as needed
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheHelper,
          useValue: mockCacheHelper,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);

    // Ensure the service has the prisma property
    (service as any).prisma = mockPrismaService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitCosmeticItem', () => {
    it('should create a new cosmetic item submission', async () => {
      const dto = {
        title: 'Test Item',
        description: 'Test Description',
        category: 'CUE_SKIN' as any,
        tags: ['test'],
        metadata: {},
      };

      const mockCreatedItem = {
        id: '1',
        ...dto,
        creatorId: 'user-1',
        status: 'PENDING',
        creator: { id: 'user-1', username: 'testuser' },
      };

      mockPrismaService.communityCosmeticItem.create.mockResolvedValue(
        mockCreatedItem
      );

      const result = await service.submitCosmeticItem('user-1', dto);

      expect(
        mockPrismaService.communityCosmeticItem.create
      ).toHaveBeenCalledWith({
        data: {
          creatorId: 'user-1',
          title: dto.title,
          description: dto.description,
          category: dto.category,
          metadata: JSON.stringify(dto.metadata),
          tags: JSON.stringify(dto.tags),
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      expect(result).toEqual(mockCreatedItem);
    });
  });

  describe('getCreatorSubmissions', () => {
    it('should return creator submissions with pagination', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Test Item',
          category: 'CUE_SKIN',
          status: 'PENDING',
          creator: { id: 'user-1', username: 'testuser' },
          metadata: '{}',
          tags: '["test"]',
        },
      ];

      mockPrismaService.communityCosmeticItem.findMany.mockResolvedValue(
        mockItems
      );
      mockPrismaService.communityCosmeticItem.count.mockResolvedValue(1);

      const result = await service.getCreatorSubmissions('user-1', 1, 20);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getSubmissionStats', () => {
    it('should return submission statistics', async () => {
      mockPrismaService.communityCosmeticItem.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(3) // approved
        .mockResolvedValueOnce(1) // rejected
        .mockResolvedValueOnce(1); // requires changes

      mockPrismaService.communityCosmeticItem.aggregate.mockResolvedValue({
        _sum: {
          likes: 25,
          views: 150,
        },
      });

      const result = await service.getSubmissionStats();

      expect(result).toEqual({
        total: 10,
        pending: 5,
        approved: 3,
        rejected: 1,
        requiresChanges: 1,
        totalLikes: 25,
        totalViews: 150,
      });
    });
  });
});
