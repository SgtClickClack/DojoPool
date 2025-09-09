import { Test, TestingModule } from '@nestjs/testing';
import { CacheHelper } from '../cache/cache.helper';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;
  let gateway: NotificationsGateway;
  let cacheHelper: CacheHelper;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGateway = {
    emitToUser: jest.fn(),
  };

  const mockCacheHelper = {
    invalidateCache: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsGateway,
          useValue: mockGateway,
        },
        {
          provide: CacheHelper,
          useValue: mockCacheHelper,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    cacheHelper = module.get<CacheHelper>(CacheHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification and emit real-time event', async () => {
      const recipientId = 'user-1';
      const type = 'challenge_received';
      const message = 'You have been challenged!';
      const payload = { challengerId: 'user-2', matchId: 'match-1' };

      const mockCreatedNotification = {
        id: 'notification-1',
        recipientId,
        userId: recipientId,
        title: type,
        type,
        message,
        payload: JSON.stringify(payload),
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        mockCreatedNotification
      );

      const result = await service.createNotification(
        recipientId,
        type,
        message,
        payload
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          recipientId,
          userId: recipientId,
          title: type,
          type,
          message,
          payload: JSON.stringify(payload),
        },
      });

      expect(mockGateway.emitToUser).toHaveBeenCalledWith(
        recipientId,
        'new_notification',
        mockCreatedNotification
      );

      expect(result).toEqual(mockCreatedNotification);
    });

    it('should handle null payload', async () => {
      const recipientId = 'user-1';
      const type = 'system_update';
      const message = 'System maintenance scheduled';

      const mockCreatedNotification = {
        id: 'notification-2',
        recipientId,
        userId: recipientId,
        title: type,
        type,
        message,
        payload: 'null',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        mockCreatedNotification
      );

      const result = await service.createNotification(
        recipientId,
        type,
        message
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          recipientId,
          userId: recipientId,
          title: type,
          type,
          message,
          payload: 'null',
        },
      });

      expect(result).toEqual(mockCreatedNotification);
    });

    it('should handle gateway emission failure gracefully', async () => {
      const recipientId = 'user-1';
      const type = 'achievement_unlocked';
      const message = 'New achievement unlocked!';

      const mockCreatedNotification = {
        id: 'notification-3',
        recipientId,
        userId: recipientId,
        title: type,
        type,
        message,
        payload: 'null',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        mockCreatedNotification
      );
      mockGateway.emitToUser.mockImplementation(() => {
        throw new Error('WebSocket connection failed');
      });

      // Should not throw error even if gateway fails
      const result = await service.createNotification(
        recipientId,
        type,
        message
      );

      expect(result).toEqual(mockCreatedNotification);
      expect(mockGateway.emitToUser).toHaveBeenCalled();
    });
  });

  describe('findForUser', () => {
    it('should return paginated notifications with counts', async () => {
      const userId = 'user-1';
      const page = 1;
      const limit = 10;

      const mockNotifications = [
        {
          id: 'notification-1',
          type: 'challenge_received',
          message: 'You have been challenged!',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notification-2',
          type: 'match_result',
          message: 'You won your match!',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications
      );
      mockPrismaService.notification.count
        .mockResolvedValueOnce(25) // total count
        .mockResolvedValueOnce(5); // unread count

      const result = await service.findForUser(userId, page, limit);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: limit,
      });

      expect(mockPrismaService.notification.count).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        notifications: mockNotifications,
        totalCount: 25,
        unreadCount: 5,
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      });
    });

    it('should handle empty results', async () => {
      const userId = 'user-1';

      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count
        .mockResolvedValueOnce(0) // total count
        .mockResolvedValueOnce(0); // unread count

      const result = await service.findForUser(userId);

      expect(result).toEqual({
        notifications: [],
        totalCount: 0,
        unreadCount: 0,
        pagination: {
          page: 1,
          limit: 50,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should handle pagination correctly', async () => {
      const userId = 'user-1';
      const page = 3;
      const limit = 5;

      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count
        .mockResolvedValueOnce(23) // total count
        .mockResolvedValueOnce(2); // unread count

      await service.findForUser(userId, page, limit);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        skip: 10, // (page-1) * limit
        take: 5,
      });
    });
  });

  describe('markRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notification-1';
      const userId = 'user-1';

      const mockExistingNotification = {
        id: notificationId,
        recipientId: userId,
        isRead: false,
      };

      const mockUpdatedNotification = {
        ...mockExistingNotification,
        isRead: true,
        updatedAt: new Date(),
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockExistingNotification
      );
      mockPrismaService.notification.update.mockResolvedValue(
        mockUpdatedNotification
      );

      const result = await service.markRead(notificationId, userId);

      expect(mockPrismaService.notification.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId },
      });

      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { isRead: true },
      });

      expect(result).toEqual(mockUpdatedNotification);
    });

    it('should throw NotFoundException for non-existent notification', async () => {
      const notificationId = 'non-existent';
      const userId = 'user-1';

      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.markRead(notificationId, userId)).rejects.toThrow(
        'Notification not found'
      );
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      const notificationId = 'notification-1';
      const userId = 'user-1';
      const otherUserId = 'user-2';

      const mockExistingNotification = {
        id: notificationId,
        recipientId: otherUserId,
        isRead: false,
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockExistingNotification
      );

      await expect(service.markRead(notificationId, userId)).rejects.toThrow(
        'Not allowed'
      );
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read for user', async () => {
      const userId = 'user-1';

      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllRead(userId);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: userId, isRead: false },
        data: { isRead: true },
      });

      expect(result).toEqual({ count: 5 });
    });

    it('should return zero count when no unread notifications', async () => {
      const userId = 'user-1';

      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllRead(userId);

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const userId = 'user-1';
      const expectedCount = 7;

      mockPrismaService.notification.count.mockResolvedValue(expectedCount);

      const result = await service.getUnreadCount(userId);

      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { recipientId: userId, isRead: false },
      });

      expect(result).toEqual(expectedCount);
    });

    it('should return zero for user with no unread notifications', async () => {
      const userId = 'user-1';

      mockPrismaService.notification.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(userId);

      expect(result).toEqual(0);
    });
  });
});
