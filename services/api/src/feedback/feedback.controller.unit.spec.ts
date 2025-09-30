import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackCategory, FeedbackStatus } from '@prisma/client';
import { vi } from 'vitest';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { TestDependencyInjector } from '../__tests__/utils/test-dependency-injector';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PERMISSIONS_SERVICE_TOKEN } from '../common/interfaces/user.interfaces';

vi.mock('@prisma/client', async (importOriginal) => {
  const originalModule =
    await importOriginal<typeof import('@prisma/client')>();
  return {
    ...originalModule,
    FeedbackCategory: {
      BUG: 'BUG',
      FEATURE_REQUEST: 'FEATURE_REQUEST',
      TECHNICAL_SUPPORT: 'TECHNICAL_SUPPORT',
      GENERAL: 'GENERAL',
    },
    FeedbackStatus: {
      PENDING: 'PENDING',
      IN_REVIEW: 'IN_REVIEW',
      RESOLVED: 'RESOLVED',
      REJECTED: 'REJECTED',
    },
  };
});

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let feedbackService: jest.Mocked<FeedbackService>;

  const mockFeedback = {
    id: 'feedback-1',
    message: 'Test feedback message',
    category: FeedbackCategory.BUG,
    status: FeedbackStatus.PENDING,
    userId: 'user-1',
    additionalContext: 'Additional context',
    adminNotes: null,
    resolvedAt: null,
    resolvedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    userId: 'user-1',
    username: 'testuser',
    role: 'USER',
  };

  beforeEach(async () => {
    const mockFeedbackService = {
      create: vi.fn(),
      findByUser: vi.fn(),
      findOne: vi.fn(),
      delete: vi.fn(),
      findAllForAdmin: vi.fn(),
      getStats: vi.fn(),
      update: vi.fn(),
    };

    const mockPermissionsService = {
      can: vi.fn(),
      hasRole: vi.fn(),
      isAdmin: vi.fn().mockReturnValue(true),
      isVenueAdmin: vi.fn(),
      isOwner: vi.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: vi.fn().mockReturnValue(true),
    };

    const mockAdminGuard = {
      canActivate: vi.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: mockFeedbackService,
        },
        {
          provide: PERMISSIONS_SERVICE_TOKEN,
          useValue: mockPermissionsService,
        },
        {
          provide: JwtAuthGuard,
          useValue: mockJwtAuthGuard,
        },
        {
          provide: AdminGuard,
          useValue: mockAdminGuard,
        },
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
    feedbackService = module.get(FeedbackService);

    // Use TestDependencyInjector to ensure proper dependency injection
    TestDependencyInjector.setupServiceWithMocks(controller, {
      feedbackService: mockFeedbackService,
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create feedback successfully', async () => {
      const createFeedbackDto = {
        message: 'Test feedback message',
        category: FeedbackCategory.BUG,
        additionalContext: 'Additional context',
      };

      const mockRequest = {
        user: mockUser,
      };

      feedbackService.create.mockResolvedValue(mockFeedback);

      const result = await controller.create(createFeedbackDto, mockRequest);

      expect(feedbackService.create).toHaveBeenCalledWith(
        createFeedbackDto,
        mockUser.userId
      );
      expect(result).toEqual(mockFeedback);
    });
  });

  describe('findMyFeedback', () => {
    it('should return user feedback with pagination', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const mockResponse = {
        feedback: [mockFeedback],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      feedbackService.findByUser.mockResolvedValue(mockResponse);

      const result = await controller.findMyFeedback(1, 10, mockRequest);

      expect(feedbackService.findByUser).toHaveBeenCalledWith(
        mockUser.userId,
        1,
        10
      );
      expect(result).toEqual(mockResponse);
    });

    it('should use default pagination values', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const mockResponse = {
        feedback: [mockFeedback],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      feedbackService.findByUser.mockResolvedValue(mockResponse);

      const result = await controller.findMyFeedback(
        undefined,
        undefined,
        mockRequest
      );

      expect(feedbackService.findByUser).toHaveBeenCalledWith(
        mockUser.userId,
        1,
        10
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findMyFeedbackById', () => {
    it('should return user feedback by id', async () => {
      const mockRequest = {
        user: mockUser,
      };

      feedbackService.findOne.mockResolvedValue(mockFeedback);

      const result = await controller.findMyFeedbackById(
        'feedback-1',
        mockRequest
      );

      expect(feedbackService.findOne).toHaveBeenCalledWith('feedback-1');
      expect(result).toEqual(mockFeedback);
    });

    it('should throw error if user tries to access other user feedback', async () => {
      const mockRequest = {
        user: { ...mockUser, userId: 'other-user' },
      };

      feedbackService.findOne.mockResolvedValue(mockFeedback);

      await expect(
        controller.findMyFeedbackById('feedback-1', mockRequest)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteMyFeedback', () => {
    it('should delete user feedback', async () => {
      const mockRequest = {
        user: mockUser,
      };

      feedbackService.delete.mockResolvedValue(undefined);

      await controller.deleteMyFeedback('feedback-1', mockRequest);

      expect(feedbackService.delete).toHaveBeenCalledWith(
        'feedback-1',
        mockUser.userId
      );
    });
  });

  describe('findAllForAdmin', () => {
    it('should return all feedback for admin', async () => {
      const filters = {
        category: FeedbackCategory.BUG,
        status: FeedbackStatus.PENDING,
      };

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

      feedbackService.findAllForAdmin.mockResolvedValue(mockResponse);

      const result = await controller.findAllForAdmin(filters, 1, 20);

      expect(feedbackService.findAllForAdmin).toHaveBeenCalledWith(
        filters,
        1,
        20
      );
      expect(result).toEqual(mockResponse);
    });

    it('should use default pagination values', async () => {
      const filters = {};

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

      feedbackService.findAllForAdmin.mockResolvedValue(mockResponse);

      const result = await controller.findAllForAdmin(
        filters,
        undefined,
        undefined
      );

      expect(feedbackService.findAllForAdmin).toHaveBeenCalledWith(
        filters,
        1,
        20
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getStats', () => {
    it('should return feedback statistics', async () => {
      const mockStats = {
        total: 10,
        pending: 5,
        resolved: 3,
        inReview: 2,
      };

      feedbackService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(feedbackService.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('findOne', () => {
    it('should return feedback by id', async () => {
      feedbackService.findOne.mockResolvedValue(mockFeedback);

      const result = await controller.findOne('feedback-1');

      expect(feedbackService.findOne).toHaveBeenCalledWith('feedback-1');
      expect(result).toEqual(mockFeedback);
    });
  });

  describe('update', () => {
    it('should update feedback', async () => {
      const updateFeedbackDto = {
        status: FeedbackStatus.IN_REVIEW,
        adminNotes: 'Reviewing this feedback',
      };

      const mockRequest = {
        user: { ...mockUser, role: 'ADMIN' },
      };

      const updatedFeedback = {
        ...mockFeedback,
        status: FeedbackStatus.IN_REVIEW,
        adminNotes: 'Reviewing this feedback',
      };

      feedbackService.update.mockResolvedValue(updatedFeedback);

      const result = await controller.update(
        'feedback-1',
        updateFeedbackDto,
        mockRequest
      );

      expect(feedbackService.update).toHaveBeenCalledWith(
        'feedback-1',
        updateFeedbackDto,
        mockRequest.user.userId
      );
      expect(result).toEqual(updatedFeedback);
    });
  });
});
