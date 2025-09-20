import { Test, TestingModule } from '@nestjs/testing';
import {
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
} from '@prisma/client';
import { TestDependencyInjector } from '../__tests__/utils/test-dependency-injector';
import { CacheHelper } from '../cache/cache.helper';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let prismaService: jest.Mocked<PrismaService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let cacheHelper: jest.Mocked<CacheHelper>;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockFeedback = {
    id: 'feedback-1',
    userId: 'user-1',
    message: 'Test feedback message',
    category: FeedbackCategory.BUG,
    status: FeedbackStatus.PENDING,
    priority: FeedbackPriority.NORMAL,
    adminNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    resolvedBy: null,
    user: mockUser,
  };

  beforeEach(async () => {
    const mockPrismaService = TestDependencyInjector.createMockPrismaService();
    const mockNotificationsService =
      TestDependencyInjector.createMockNotificationsService();
    const mockCacheHelper = TestDependencyInjector.createMockCacheHelper();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: CacheHelper,
          useValue: mockCacheHelper,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    prismaService = module.get(PrismaService);
    notificationsService = module.get(NotificationsService);
    cacheHelper = module.get(CacheHelper);

    // Use the test utility to fix dependency injection
    TestDependencyInjector.setupServiceWithMocks(service, {
      prisma: mockPrismaService,
      notificationsService: mockNotificationsService,
      cacheHelper: mockCacheHelper,
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create feedback successfully', async () => {
      const createFeedbackDto = {
        message: 'Test feedback message',
        category: FeedbackCategory.BUG,
      };

      prismaService.feedback.create.mockResolvedValue(mockFeedback);
      prismaService.user.findMany.mockResolvedValue([
        {
          id: 'admin-1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      ]);
      notificationsService.createNotification.mockResolvedValue({} as any);

      const result = await service.create(createFeedbackDto, 'user-1');

      expect(prismaService.feedback.create).toHaveBeenCalledWith({
        data: {
          ...createFeedbackDto,
          userId: 'user-1',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockFeedback);
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('should notify admins when feedback is created', async () => {
      const createFeedbackDto = {
        message: 'Test feedback message',
        category: FeedbackCategory.BUG,
      };

      prismaService.feedback.create.mockResolvedValue(mockFeedback);
      prismaService.user.findMany.mockResolvedValue([
        {
          id: 'admin-1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
        {
          id: 'admin-2',
          username: 'admin2',
          email: 'admin2@example.com',
          role: 'ADMIN',
        },
      ]);
      notificationsService.createNotification.mockResolvedValue({} as any);

      await service.create(createFeedbackDto, 'user-1');

      expect(notificationsService.createNotification).toHaveBeenCalledTimes(2);
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        'admin-1',
        'NEW_FEEDBACK_SUBMITTED',
        'New bug report feedback from testuser',
        expect.any(Object)
      );
    });
  });

  describe('findAllForAdmin', () => {
    it('should return paginated feedback for admin', async () => {
      const filters = { status: FeedbackStatus.PENDING };
      const mockResponse = {
        feedback: [mockFeedback],
        totalCount: 1,
        pendingCount: 1,
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      prismaService.feedback.findMany.mockResolvedValue([mockFeedback]);
      prismaService.feedback.count.mockResolvedValueOnce(1); // totalCount
      prismaService.feedback.count.mockResolvedValueOnce(1); // pendingCount

      const result = await service.findAllForAdmin(filters, 1, 20);

      expect(result).toEqual(mockResponse);
      expect(prismaService.feedback.findMany).toHaveBeenCalledWith({
        where: filters,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return feedback by id', async () => {
      prismaService.feedback.findUnique.mockResolvedValue(mockFeedback);

      const result = await service.findOne('feedback-1');

      expect(result).toEqual(mockFeedback);
      expect(prismaService.feedback.findUnique).toHaveBeenCalledWith({
        where: { id: 'feedback-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if feedback not found', async () => {
      prismaService.feedback.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Feedback not found'
      );
    });
  });

  describe('findByUser', () => {
    it('should return user feedback', async () => {
      const mockUserFeedback = { ...mockFeedback };
      delete mockUserFeedback.user;
      delete mockUserFeedback.resolver;

      prismaService.feedback.findMany.mockResolvedValue([mockUserFeedback]);
      prismaService.feedback.count.mockResolvedValue(1);

      const result = await service.findByUser('user-1', 1, 10);

      expect(result.feedback).toEqual([mockUserFeedback]);
      expect(result.pagination).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update feedback status', async () => {
      const updateDto = { status: FeedbackStatus.RESOLVED };
      const updatedFeedback = {
        ...mockFeedback,
        status: FeedbackStatus.RESOLVED,
      };

      prismaService.feedback.findUnique.mockResolvedValue(mockFeedback);
      prismaService.feedback.update.mockResolvedValue(updatedFeedback);
      notificationsService.createNotification.mockResolvedValue({} as any);

      const result = await service.update('feedback-1', updateDto, 'admin-1');

      expect(result.status).toBe(FeedbackStatus.RESOLVED);
      expect(prismaService.feedback.update).toHaveBeenCalledWith({
        where: { id: 'feedback-1' },
        data: expect.objectContaining(updateDto),
        include: expect.any(Object),
      });
    });

    it('should notify user when feedback is resolved', async () => {
      const updateDto = { status: FeedbackStatus.RESOLVED };
      const updatedFeedback = {
        ...mockFeedback,
        status: FeedbackStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: 'admin-1',
      };

      prismaService.feedback.findUnique.mockResolvedValue(mockFeedback);
      prismaService.feedback.update.mockResolvedValue(updatedFeedback);
      notificationsService.createNotification.mockResolvedValue({} as any);

      await service.update('feedback-1', updateDto, 'admin-1');

      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        'user-1',
        'SYSTEM',
        'Your feedback has been resolved',
        expect.any(Object)
      );
    });
  });

  describe('delete', () => {
    it('should delete user feedback', async () => {
      prismaService.feedback.findUnique.mockResolvedValue(mockFeedback);

      await service.delete('feedback-1', 'user-1');

      expect(prismaService.feedback.delete).toHaveBeenCalledWith({
        where: { id: 'feedback-1' },
      });
    });

    it('should throw ForbiddenException if user tries to delete others feedback', async () => {
      prismaService.feedback.findUnique.mockResolvedValue(mockFeedback);

      await expect(service.delete('feedback-1', 'other-user')).rejects.toThrow(
        'You can only delete your own feedback'
      );
    });
  });

  describe('getStats', () => {
    it('should return feedback statistics', async () => {
      const mockResolvedFeedback = [
        {
          createdAt: new Date('2024-01-01'),
          resolvedAt: new Date('2024-01-02'),
        },
      ];

      prismaService.feedback.count.mockImplementation((args) => {
        if (args?.where?.status === FeedbackStatus.PENDING)
          return Promise.resolve(5);
        if (args?.where?.status === FeedbackStatus.IN_REVIEW)
          return Promise.resolve(3);
        if (args?.where?.status === FeedbackStatus.RESOLVED)
          return Promise.resolve(10);
        if (args?.where?.status === FeedbackStatus.CLOSED)
          return Promise.resolve(2);
        if (args?.where?.status === FeedbackStatus.REJECTED)
          return Promise.resolve(1);
        return Promise.resolve(21); // total
      });

      prismaService.feedback.findMany.mockResolvedValue(mockResolvedFeedback);

      const result = await service.getStats();

      expect(result.total).toBe(21);
      expect(result.pending).toBe(5);
      expect(result.resolved).toBe(10);
      expect(result.averageResolutionTime).toBeDefined();
    });
  });
});
