import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryEventData, TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    telemetryEvent: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('recordEvent', () => {
    it('should record a telemetry event asynchronously', async () => {
      const eventData: TelemetryEventData = {
        eventName: 'user_login',
        userId: 'user-123',
        sessionId: 'session-456',
        data: { source: 'web' },
      };

      const mockCreatedEvent = {
        id: 'event-123',
        ...eventData,
        timestamp: new Date(),
        processed: false,
      };

      mockPrismaService.telemetryEvent.create.mockResolvedValue(
        mockCreatedEvent
      );

      // Call the method (it should return immediately due to async processing)
      await service.recordEvent(eventData);

      // Wait for the async operation to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockPrismaService.telemetryEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventName: 'user_login',
          userId: 'user-123',
          sessionId: 'session-456',
          data: { source: 'web' },
        }),
      });
    });

    it('should handle events without optional fields', async () => {
      const eventData: TelemetryEventData = {
        eventName: 'page_view',
      };

      mockPrismaService.telemetryEvent.create.mockResolvedValue({
        id: 'event-124',
        ...eventData,
        timestamp: new Date(),
        processed: false,
      });

      await service.recordEvent(eventData);

      // Wait for the async operation to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockPrismaService.telemetryEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventName: 'page_view',
          userId: null,
          sessionId: null,
          data: {},
        }),
      });
    });

    it('should handle errors gracefully', async () => {
      const eventData: TelemetryEventData = {
        eventName: 'test_event',
      };

      const mockError = new Error('Database connection failed');
      mockPrismaService.telemetryEvent.create.mockRejectedValue(mockError);

      // Should not throw error - async processing should handle it internally
      await expect(service.recordEvent(eventData)).resolves.toBeUndefined();

      // Wait for the async operation to complete
      await new Promise((resolve) => setImmediate(resolve));

      // The error should be logged but not thrown
      expect(mockPrismaService.telemetryEvent.create).toHaveBeenCalled();
    });
  });

  describe('recordEvents', () => {
    it('should record multiple telemetry events in batch', async () => {
      const events: TelemetryEventData[] = [
        {
          eventName: 'user_login',
          userId: 'user-123',
          data: { source: 'web' },
        },
        {
          eventName: 'page_view',
          userId: 'user-123',
          data: { page: '/dashboard' },
        },
      ];

      mockPrismaService.telemetryEvent.createMany.mockResolvedValue({
        count: 2,
      });

      await service.recordEvents(events);

      // Wait for the async operation to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockPrismaService.telemetryEvent.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            eventName: 'user_login',
            userId: 'user-123',
            data: { source: 'web' },
          }),
          expect.objectContaining({
            eventName: 'page_view',
            userId: 'user-123',
            data: { page: '/dashboard' },
          }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should handle empty events array', async () => {
      const events: TelemetryEventData[] = [];

      await service.recordEvents(events);

      // Wait for the async operation to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(
        mockPrismaService.telemetryEvent.createMany
      ).not.toHaveBeenCalled();
    });
  });

  describe('getAnalyticsData', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    beforeEach(() => {
      // Setup default mocks
      mockPrismaService.user.count.mockResolvedValue(1000);
      mockPrismaService.telemetryEvent.count.mockResolvedValue(50000);
      mockPrismaService.telemetryEvent.groupBy.mockResolvedValue([
        { eventName: 'user_login', _count: { eventName: 1200 } },
        { eventName: 'page_view', _count: { eventName: 3500 } },
        { eventName: 'button_click', _count: { eventName: 2100 } },
      ]);
      mockPrismaService.telemetryEvent.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          sessionId: 'session-1',
          data: {},
          timestamp: new Date('2024-01-15'),
        },
        {
          userId: 'user-2',
          sessionId: 'session-2',
          data: {},
          timestamp: new Date('2024-01-16'),
        },
      ]);
    });

    it('should return comprehensive analytics data', async () => {
      const result = await service.getAnalyticsData(startDate, endDate);

      expect(result).toHaveProperty('dau');
      expect(result).toHaveProperty('mau');
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('totalEvents');
      expect(result).toHaveProperty('topEvents');
      expect(result).toHaveProperty('userEngagement');
      expect(result).toHaveProperty('featureUsage');
      expect(result).toHaveProperty('systemPerformance');
      expect(result).toHaveProperty('economyMetrics');

      expect(result.totalUsers).toBe(1000);
      expect(result.totalEvents).toBe(50000);
      expect(result.topEvents).toHaveLength(3);
      expect(result.topEvents[0]).toEqual({
        eventName: 'user_login',
        count: 1200,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.user.count.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        service.getAnalyticsData(startDate, endDate)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getTopEvents', () => {
    it('should return top events ordered by count', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrismaService.telemetryEvent.groupBy.mockResolvedValue([
        { eventName: 'page_view', _count: { eventName: 5000 } },
        { eventName: 'user_login', _count: { eventName: 1200 } },
        { eventName: 'button_click', _count: { eventName: 800 } },
      ]);

      const result = await service['getTopEvents'](startDate, endDate);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ eventName: 'page_view', count: 5000 });
      expect(result[1]).toEqual({ eventName: 'user_login', count: 1200 });
      expect(result[2]).toEqual({ eventName: 'button_click', count: 800 });

      expect(mockPrismaService.telemetryEvent.groupBy).toHaveBeenCalledWith({
        by: ['eventName'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          eventName: true,
        },
        orderBy: {
          _count: {
            eventName: 'desc',
          },
        },
        take: 10,
      });
    });

    it('should handle empty results', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrismaService.telemetryEvent.groupBy.mockResolvedValue([]);

      const result = await service['getTopEvents'](startDate, endDate);

      expect(result).toHaveLength(0);
    });
  });

  describe('getUserEngagementData', () => {
    it('should return user engagement data for the date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');

      // Mock events for different days
      mockPrismaService.telemetryEvent.findMany
        .mockResolvedValueOnce([
          {
            userId: 'user-1',
            sessionId: 'session-1',
            data: {},
            timestamp: new Date('2024-01-01'),
          },
          {
            userId: 'user-2',
            sessionId: 'session-2',
            data: {},
            timestamp: new Date('2024-01-01'),
          },
        ])
        .mockResolvedValueOnce([
          {
            userId: 'user-1',
            sessionId: 'session-1',
            data: {},
            timestamp: new Date('2024-01-02'),
          },
          {
            userId: 'user-3',
            sessionId: 'session-3',
            data: {},
            timestamp: new Date('2024-01-02'),
          },
        ])
        .mockResolvedValueOnce([
          {
            userId: 'user-2',
            sessionId: 'session-2',
            data: {},
            timestamp: new Date('2024-01-03'),
          },
        ]);

      const result = await service['getUserEngagementData'](startDate, endDate);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        activeUsers: 2,
        sessions: 2,
        avgSessionLength: 0,
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        activeUsers: 2,
        sessions: 2,
        avgSessionLength: 0,
      });
      expect(result[2]).toEqual({
        date: '2024-01-03',
        activeUsers: 1,
        sessions: 1,
        avgSessionLength: 0,
      });
    });

    it('should calculate session lengths correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-01');

      mockPrismaService.telemetryEvent.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          sessionId: 'session-1',
          eventName: 'session_start',
          data: {},
          timestamp: new Date('2024-01-01T10:00:00Z'),
        },
        {
          userId: 'user-1',
          sessionId: 'session-1',
          eventName: 'session_end',
          data: {},
          timestamp: new Date('2024-01-01T10:30:00Z'), // 30 minutes = 1800 seconds
        },
      ]);

      const result = await service['getUserEngagementData'](startDate, endDate);

      expect(result[0].avgSessionLength).toBe(1800); // 30 minutes in seconds
    });
  });

  describe('processPendingEvents', () => {
    it('should process pending telemetry events', async () => {
      const pendingEvents = [
        {
          id: 'event-1',
          eventName: 'user_login',
          processed: false,
        },
        {
          id: 'event-2',
          eventName: 'page_view',
          processed: false,
        },
      ];

      mockPrismaService.telemetryEvent.findMany.mockResolvedValue(
        pendingEvents
      );
      mockPrismaService.telemetryEvent.updateMany.mockResolvedValue({
        count: 2,
      });

      await service.processPendingEvents();

      expect(mockPrismaService.telemetryEvent.findMany).toHaveBeenCalledWith({
        where: {
          processed: false,
        },
        take: 100,
      });

      expect(mockPrismaService.telemetryEvent.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['event-1', 'event-2'],
          },
        },
        data: {
          processed: true,
          processedAt: expect.any(Date),
        },
      });
    });

    it('should handle no pending events', async () => {
      mockPrismaService.telemetryEvent.findMany.mockResolvedValue([]);

      await service.processPendingEvents();

      expect(
        mockPrismaService.telemetryEvent.updateMany
      ).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOldEvents', () => {
    it('should delete old telemetry events', async () => {
      mockPrismaService.telemetryEvent.deleteMany.mockResolvedValue({
        count: 150,
      });

      await service.cleanupOldEvents(30); // 30 days

      const expectedCutoffDate = new Date();
      expectedCutoffDate.setDate(expectedCutoffDate.getDate() - 30);

      expect(mockPrismaService.telemetryEvent.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date),
          },
          processed: true,
        },
      });
    });

    it('should use default retention period', async () => {
      mockPrismaService.telemetryEvent.deleteMany.mockResolvedValue({
        count: 200,
      });

      await service.cleanupOldEvents();

      const expectedCutoffDate = new Date();
      expectedCutoffDate.setDate(expectedCutoffDate.getDate() - 90); // Default 90 days

      expect(mockPrismaService.telemetryEvent.deleteMany).toHaveBeenCalled();
    });
  });
});
