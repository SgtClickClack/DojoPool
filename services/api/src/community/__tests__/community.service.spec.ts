import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { CacheHelper } from '../../cache/cache.helper';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunityService } from '../community.service';
import { TestDependencyInjector } from '../../__tests__/utils/test-dependency-injector';

// Mock the Prisma client to include SubmissionStatus
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
  SubmissionStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    REQUIRES_CHANGES: 'REQUIRES_CHANGES',
  },
}));

import { SubmissionStatus } from '@prisma/client';

describe('CommunityService', () => {
  let service: CommunityService;
  let prismaService: PrismaService;
  let notificationsService: NotificationsService;

  const mockPrismaService = TestDependencyInjector.createMockPrismaService();
  const mockCacheHelper = TestDependencyInjector.createMockCacheHelper();
  const mockNotificationsService =
    TestDependencyInjector.createMockNotificationsService();

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

    // Use the test utility to fix dependency injection
    TestDependencyInjector.setupServiceWithMocks(service, {
      _prisma: mockPrismaService,
      cacheHelper: mockCacheHelper,
      notificationsService: mockNotificationsService,
    });

    // Explicitly set the private properties to ensure proper injection
    (service as any)._prisma = mockPrismaService;
    (service as any).cacheHelper = mockCacheHelper;
    (service as any).notificationsService = mockNotificationsService;

    // Also set the properties that the cache decorators expect
    (service as any).cacheService = mockCacheHelper;
    (service as any).cacheManager = mockCacheHelper;
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

      // Mock admin notification
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'admin-1' },
        { id: 'admin-2' },
      ]);
      mockNotificationsService.createNotification.mockResolvedValue({});

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

      // Mock cache helper for @Cacheable decorator
      mockCacheHelper.get.mockResolvedValue(null); // No cached result
      mockCacheHelper.set.mockResolvedValue(undefined);

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
