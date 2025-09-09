import { Test, TestingModule } from '@nestjs/testing';
import { AchievementCategory, AchievementStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AchievementService } from '../achievement.service';

const mockPrismaService = {
  achievement: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userAchievement: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('AchievementService', () => {
  let service: AchievementService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserAchievements', () => {
    it('should return user achievements with progress', async () => {
      const mockUserAchievements = [
        {
          achievementId: 'achievement1',
          progress: 5,
          progressMax: 10,
          status: AchievementStatus.LOCKED,
        },
      ];

      const mockAchievements = [
        {
          id: 'achievement1',
          name: 'Test Achievement',
          criteriaValue: 10,
        },
        {
          id: 'achievement2',
          name: 'Another Achievement',
          criteriaValue: 5,
        },
      ];

      mockPrismaService.userAchievement.findMany.mockResolvedValue(
        mockUserAchievements
      );
      mockPrismaService.achievement.findMany.mockResolvedValue(
        mockAchievements
      );

      const result = await service.getUserAchievements('user1');

      expect(result).toHaveLength(2);
      expect(result[0].currentProgress).toBe(5);
      expect(result[0].maxProgress).toBe(10);
      expect(result[1].currentProgress).toBe(0);
      expect(result[1].maxProgress).toBe(5);
    });
  });

  describe('updateProgress', () => {
    it('should update achievement progress and unlock when complete', async () => {
      const mockAchievement = {
        id: 'achievement1',
        criteriaType: 'VENUE_CHECK_INS',
        criteriaValue: 5,
        criteriaMetadata: '{}',
      };

      mockPrismaService.achievement.findMany.mockResolvedValue([
        mockAchievement,
      ]);
      mockPrismaService.userAchievement.upsert.mockResolvedValue({
        achievementId: 'achievement1',
        progress: 5,
        progressMax: 5,
        status: AchievementStatus.UNLOCKED,
      });

      const result = await service.updateProgress(
        'user1',
        'VENUE_CHECK_INS',
        1
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('achievement1');
      expect(mockPrismaService.userAchievement.upsert).toHaveBeenCalled();
    });

    it('should handle metadata-based criteria', async () => {
      const mockAchievement = {
        id: 'achievement1',
        criteriaType: 'VENUE_LOYALTY',
        criteriaValue: 5,
        criteriaMetadata: JSON.stringify({ venueId: 'venue1' }),
      };

      mockPrismaService.achievement.findMany.mockResolvedValue([
        mockAchievement,
      ]);
      mockPrismaService.userAchievement.upsert.mockResolvedValue({
        achievementId: 'achievement1',
        progress: 1,
        progressMax: 5,
        status: AchievementStatus.LOCKED,
      });

      const result = await service.updateProgress('user1', 'VENUE_LOYALTY', 1, {
        venueId: 'venue1',
      });

      expect(result).toHaveLength(0); // Not unlocked yet
    });

    it('should skip achievements with non-matching metadata', async () => {
      const mockAchievement = {
        id: 'achievement1',
        criteriaType: 'VENUE_LOYALTY',
        criteriaValue: 5,
        criteriaMetadata: JSON.stringify({ venueId: 'venue1' }),
      };

      mockPrismaService.achievement.findMany.mockResolvedValue([
        mockAchievement,
      ]);

      const result = await service.updateProgress('user1', 'VENUE_LOYALTY', 1, {
        venueId: 'venue2', // Different venue
      });

      expect(result).toHaveLength(0); // No achievements updated
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock an achievement successfully', async () => {
      const mockUserAchievement = {
        id: 'userAchievement1',
        achievementId: 'achievement1',
        status: AchievementStatus.UNLOCKED,
        unlockedAt: new Date(),
      };

      mockPrismaService.userAchievement.update.mockResolvedValue(
        mockUserAchievement
      );

      const result = await service.unlockAchievement('user1', 'achievement1');

      expect(result.status).toBe(AchievementStatus.UNLOCKED);
      expect(result.unlockedAt).toBeDefined();
    });
  });

  describe('createAchievement', () => {
    it('should create a new achievement', async () => {
      const achievementData = {
        key: 'test_achievement',
        name: 'Test Achievement',
        description: 'A test achievement',
        category: AchievementCategory.VENUE_VISITS,
        criteriaType: 'VENUE_CHECK_INS',
        criteriaValue: 5,
        isHidden: false,
      };

      const mockAchievement = {
        id: 'achievement1',
        ...achievementData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.achievement.create.mockResolvedValue(mockAchievement);

      const result = await service.createAchievement(achievementData);

      expect(result.key).toBe('test_achievement');
      expect(result.name).toBe('Test Achievement');
      expect(result.category).toBe(AchievementCategory.VENUE_VISITS);
    });
  });

  describe('getUserStats', () => {
    it('should return user achievement statistics', async () => {
      const mockUserAchievements = [
        { status: AchievementStatus.UNLOCKED, rewardClaimed: true },
        { status: AchievementStatus.LOCKED, rewardClaimed: false },
        { status: AchievementStatus.CLAIMED, rewardClaimed: true },
      ];

      mockPrismaService.achievement.count.mockResolvedValue(10);
      mockPrismaService.userAchievement.findMany.mockResolvedValue(
        mockUserAchievements
      );

      const result = await service.getUserStats('user1');

      expect(result.totalAchievements).toBe(10);
      expect(result.unlockedAchievements).toBe(2); // UNLOCKED + CLAIMED
      expect(result.claimedRewards).toBe(2); // Both with rewardClaimed: true
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should return achievements filtered by category', async () => {
      const mockAchievements = [
        {
          id: 'achievement1',
          name: 'Venue Achievement',
          category: AchievementCategory.VENUE_VISITS,
          isHidden: false,
        },
        {
          id: 'achievement2',
          name: 'Match Achievement',
          category: AchievementCategory.MATCHES_WON,
          isHidden: false,
        },
      ];

      mockPrismaService.achievement.findMany.mockResolvedValue([
        mockAchievements[0],
      ]);

      const result = await service.getAchievementsByCategory(
        AchievementCategory.VENUE_VISITS
      );

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(AchievementCategory.VENUE_VISITS);
    });

    it('should include hidden achievements when requested', async () => {
      const mockAchievements = [
        {
          id: 'achievement1',
          name: 'Hidden Achievement',
          category: AchievementCategory.PROGRESSION,
          isHidden: true,
        },
      ];

      mockPrismaService.achievement.findMany.mockResolvedValue(
        mockAchievements
      );

      const result = await service.getAchievementsByCategory(
        AchievementCategory.PROGRESSION,
        true // includeHidden
      );

      expect(result).toHaveLength(1);
      expect(result[0].isHidden).toBe(true);
    });
  });

  describe('resetAchievementProgress', () => {
    it('should reset achievement progress', async () => {
      const mockResetAchievement = {
        id: 'userAchievement1',
        achievementId: 'achievement1',
        progress: 0,
        status: AchievementStatus.LOCKED,
        unlockedAt: null,
        claimedAt: null,
        rewardClaimed: false,
      };

      mockPrismaService.userAchievement.update.mockResolvedValue(
        mockResetAchievement
      );

      const result = await service.resetAchievementProgress(
        'user1',
        'achievement1'
      );

      expect(result.progress).toBe(0);
      expect(result.status).toBe(AchievementStatus.LOCKED);
      expect(result.unlockedAt).toBeNull();
      expect(result.rewardClaimed).toBe(false);
    });
  });
});
