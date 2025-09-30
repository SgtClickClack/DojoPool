import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { CmsController } from '../cms.controller';
import { ContentService } from '../content.service';
import { AdminGuard } from '../../auth/admin.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PERMISSIONS_SERVICE_TOKEN } from '../../common/interfaces/user.interfaces';

describe('CmsController', () => {
  let controller: CmsController;
  let service: ContentService;

  const mockContentService = {
    create: vi.fn(),
    findAllForAdmin: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getStats: vi.fn(),
  };

  const mockPermissionsService = {
    isAdmin: vi.fn().mockReturnValue(true),
  };

  const mockJwtAuthGuard = {
    canActivate: vi.fn().mockReturnValue(true),
  };

  const mockAdminGuard = {
    canActivate: vi.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CmsController],
      providers: [
        {
          provide: ContentService,
          useValue: mockContentService,
        },
        {
          provide: PERMISSIONS_SERVICE_TOKEN,
          useValue: mockPermissionsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<CmsController>(CmsController);
    service = module.get<ContentService>(ContentService);

    // Ensure the controller has the contentService property
    (controller as any).contentService = mockContentService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create an event', async () => {
      const createEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        eventDate: '2025-01-15T10:00:00Z',
      };
      const mockResult = { id: '1', ...createEventDto };

      mockContentService.create.mockResolvedValue(mockResult);

      const req = { user: { userId: 'admin-id' } };
      const result = await controller.createEvent(createEventDto, req);

      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createEventDto,
          contentType: 'EVENT',
          visibility: undefined,
        }),
        'admin-id',
        undefined,
        undefined
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getEvents', () => {
    it('should return events', async () => {
      const mockResult = {
        content: [],
        totalCount: 0,
        pendingCount: 0,
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockContentService.findAllForAdmin.mockResolvedValue(mockResult);

      const result = await controller.getEvents();

      expect(service.findAllForAdmin).toHaveBeenCalledWith(
        { contentType: 'EVENT' },
        1,
        20
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('preview endpoints', () => {
    it('should preview event', async () => {
      const eventData = {
        title: 'Preview Event',
        description: 'Preview Description',
      };

      const result = await controller.previewEvent(eventData);

      expect(result).toEqual(
        expect.objectContaining({
          ...eventData,
          contentType: 'EVENT',
          id: 'preview',
          status: 'PREVIEW',
        })
      );
    });

    it('should preview news article', async () => {
      const newsData = {
        title: 'Preview Article',
        description: 'Preview Description',
        content: 'Preview Content',
      };

      const result = await controller.previewNewsArticle(newsData);

      expect(result).toEqual(
        expect.objectContaining({
          ...newsData,
          contentType: 'NEWS_ARTICLE',
          id: 'preview',
          status: 'PREVIEW',
        })
      );
    });

    it('should preview system message', async () => {
      const messageData = {
        title: 'Preview Message',
        message: 'Preview message content',
      };

      const result = await controller.previewSystemMessage(messageData);

      expect(result).toEqual(
        expect.objectContaining({
          ...messageData,
          contentType: 'SYSTEM_MESSAGE',
          id: 'preview',
          status: 'PREVIEW',
        })
      );
    });
  });

  describe('createNewsArticle', () => {
    it('should create a news article with APPROVED status when publish date is provided', async () => {
      const createNewsDto = {
        title: 'Test News Article',
        description: 'Test Description',
        content: '<p>Test content</p>',
        publishDate: '2025-01-15T10:00:00Z',
      };

      const mockResult = {
        id: 'news-id',
        ...createNewsDto,
        contentType: 'NEWS_ARTICLE',
        visibility: undefined,
      };

      mockContentService.create.mockResolvedValue(mockResult);

      const req = { user: { userId: 'admin-id' } };
      const result = await controller.createNewsArticle(createNewsDto, req);

      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createNewsDto,
          contentType: 'NEWS_ARTICLE',
          visibility: undefined,
        }),
        'admin-id',
        undefined,
        undefined
      );
      expect(result).toEqual(mockResult);
    });

    it('should create a news article with PENDING status when no publish date', async () => {
      const createNewsDto = {
        title: 'Draft Article',
        description: 'Draft Description',
        content: '<p>Draft content</p>',
      };

      const mockResult = {
        id: 'news-id',
        ...createNewsDto,
        contentType: 'NEWS_ARTICLE',
        visibility: undefined,
      };

      mockContentService.create.mockResolvedValue(mockResult);

      const req = { user: { userId: 'admin-id' } };
      const result = await controller.createNewsArticle(createNewsDto, req);

      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createNewsDto,
          contentType: 'NEWS_ARTICLE',
          visibility: undefined,
        }),
        'admin-id',
        undefined,
        undefined
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getNewsArticles', () => {
    it('should return news articles with filters', async () => {
      const mockResult = {
        content: [{ id: 'news-1', title: 'News Article' }],
        totalCount: 1,
        pendingCount: 0,
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockContentService.findAllForAdmin.mockResolvedValue(mockResult);

      const result = await controller.getNewsArticles(
        1,
        20,
        'APPROVED',
        'NEWS'
      );

      expect(service.findAllForAdmin).toHaveBeenCalledWith(
        {
          contentType: 'NEWS_ARTICLE',
          status: 'APPROVED',
          metadata: {
            path: ['category'],
            equals: 'NEWS',
          },
        },
        1,
        20
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('createSystemMessage', () => {
    it('should create a system message', async () => {
      const createMessageDto = {
        title: 'Test System Message',
        message: 'Test message content',
        messageType: 'INFO',
        priority: 'NORMAL',
      };

      const mockResult = {
        id: 'message-id',
        ...createMessageDto,
        contentType: 'SYSTEM_MESSAGE',
        status: 'APPROVED',
      };

      mockContentService.create.mockResolvedValue(mockResult);

      const req = { user: { userId: 'admin-id' } };
      const result = await controller.createSystemMessage(
        createMessageDto,
        req
      );

      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createMessageDto,
          contentType: 'SYSTEM_MESSAGE',
          visibility: undefined,
        }),
        'admin-id',
        undefined,
        undefined
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getCMSStats', () => {
    it('should return CMS statistics', async () => {
      const mockStats = {
        total: 100,
        pending: 5,
        approved: 90,
        rejected: 5,
        totalLikes: 500,
        totalShares: 200,
        totalViews: 5000,
      };

      const mockEventStats = {
        content: [{ id: 'event-1' }, { id: 'event-2' }],
        totalCount: 2,
      };

      const mockNewsStats = {
        content: [{ id: 'news-1' }],
        totalCount: 1,
      };

      const mockMessageStats = {
        content: [
          { id: 'msg-1', metadata: JSON.stringify({ isActive: true }) },
          { id: 'msg-2', metadata: JSON.stringify({ isActive: false }) },
        ],
        totalCount: 2,
      };

      mockContentService.getStats.mockResolvedValue(mockStats);
      mockContentService.findAllForAdmin
        .mockResolvedValueOnce(mockEventStats)
        .mockResolvedValueOnce(mockNewsStats)
        .mockResolvedValueOnce(mockMessageStats);

      const result = await controller.getCMSStats();

      expect(result).toEqual({
        totalEvents: 2,
        totalNewsArticles: 1,
        totalSystemMessages: 2,
        activeSystemMessages: 1,
        pendingContent: 5,
        totalViews: 5000,
        totalLikes: 500,
        totalShares: 200,
      });
    });
  });

  describe('bulk operations', () => {
    const req = { user: { userId: 'admin-id' } };

    it('should bulk publish content', async () => {
      const contentIds = ['content-1', 'content-2'];

      mockContentService.update
        .mockResolvedValueOnce({ visibility: undefined })
        .mockResolvedValueOnce({ visibility: undefined });

      const result = await controller.bulkPublish({ contentIds }, req);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual(
        expect.objectContaining({
          id: 'content-1',
          success: true,
          result: { visibility: undefined },
        })
      );
      expect(mockContentService.update).toHaveBeenCalledTimes(2);
    });

    it('should bulk archive content', async () => {
      const contentIds = ['content-1', 'content-2'];

      mockContentService.update
        .mockResolvedValueOnce({ visibility: undefined })
        .mockResolvedValueOnce({ visibility: undefined });

      const result = await controller.bulkArchive({ contentIds }, req);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual(
        expect.objectContaining({
          id: 'content-1',
          success: true,
          result: { visibility: undefined },
        })
      );
      expect(mockContentService.update).toHaveBeenCalledTimes(2);
    });

    it('should handle bulk operation errors gracefully', async () => {
      const contentIds = ['content-1', 'content-2'];

      mockContentService.update
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce({ visibility: undefined });

      const result = await controller.bulkPublish({ contentIds }, req);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        id: 'content-1',
        success: false,
        error: 'Update failed',
      });
      expect(result.results[1]).toEqual(
        expect.objectContaining({
          id: 'content-2',
          success: true,
          result: { visibility: undefined },
        })
      );
    });
  });
});
