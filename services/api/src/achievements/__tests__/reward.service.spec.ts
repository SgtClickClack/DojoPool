import { Test, TestingModule } from '@nestjs/testing';
import { RewardType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RewardService } from '../reward.service';

const mockPrismaService = {
  reward: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  userAchievement: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  user: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  userAvatarAsset: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  profile: {
    upsert: jest.fn(),
  },
  clanMember: {
    findFirst: jest.fn(),
  },
  clan: {
    update: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
  },
  avatarAsset: {
    findUnique: jest.fn(),
  },
};

describe('RewardService', () => {
  let service: RewardService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RewardService>(RewardService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('claimReward', () => {
    it('should successfully claim DojoCoins reward', async () => {
      const mockUserAchievement = {
        id: 'userAchievement1',
        status: 'UNLOCKED',
        rewardClaimed: false,
        achievement: {
          rewardId: 'reward1',
        },
        reward: {
          id: 'reward1',
          type: RewardType.DOJO_COINS,
          dojoCoinAmount: 100,
          name: 'Test Reward',
        },
      };

      mockPrismaService.userAchievement.findUnique.mockResolvedValue(
        mockUserAchievement
      );
      mockPrismaService.user.update.mockResolvedValue({ dojoCoinBalance: 200 });
      mockPrismaService.transaction.create.mockResolvedValue({ id: 'tx1' });

      const result = await service.claimReward('user1', 'achievement1');

      expect(result.success).toBe(true);
      expect(result.rewardType).toBe(RewardType.DOJO_COINS);
      expect(result.rewardDetails.dojoCoins).toBe(100);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: {
          dojoCoinBalance: {
            increment: 100,
          },
        },
      });
    });

    it('should successfully claim avatar asset reward', async () => {
      const mockUserAchievement = {
        id: 'userAchievement1',
        status: 'UNLOCKED',
        rewardClaimed: false,
        achievement: {
          rewardId: 'reward1',
        },
        reward: {
          id: 'reward1',
          type: RewardType.AVATAR_ASSET,
          avatarAssetId: 'asset1',
          name: 'Avatar Reward',
        },
      };

      const mockAsset = {
        id: 'asset1',
        name: 'Cool Hat',
        type: 'HEAD',
      };

      mockPrismaService.userAchievement.findUnique.mockResolvedValue(
        mockUserAchievement
      );
      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue(null); // User doesn't own it
      mockPrismaService.userAvatarAsset.create.mockResolvedValue({
        id: 'userAsset1',
        userId: 'user1',
        assetId: 'asset1',
      });
      mockPrismaService.avatarAsset.findUnique.mockResolvedValue(mockAsset);

      const result = await service.claimReward('user1', 'achievement1');

      expect(result.success).toBe(true);
      expect(result.rewardType).toBe(RewardType.AVATAR_ASSET);
      expect(result.rewardDetails.avatarAssetId).toBe('asset1');
      expect(mockPrismaService.userAvatarAsset.create).toHaveBeenCalled();
    });

    it('should throw error if achievement is not unlocked', async () => {
      const mockUserAchievement = {
        id: 'userAchievement1',
        status: 'LOCKED',
        rewardClaimed: false,
      };

      mockPrismaService.userAchievement.findUnique.mockResolvedValue(
        mockUserAchievement
      );

      await expect(
        service.claimReward('user1', 'achievement1')
      ).rejects.toThrow('Achievement not unlocked');
    });

    it('should throw error if reward already claimed', async () => {
      const mockUserAchievement = {
        id: 'userAchievement1',
        status: 'CLAIMED',
        rewardClaimed: true,
      };

      mockPrismaService.userAchievement.findUnique.mockResolvedValue(
        mockUserAchievement
      );

      await expect(
        service.claimReward('user1', 'achievement1')
      ).rejects.toThrow('Reward already claimed');
    });

    it('should throw error if user already owns avatar asset', async () => {
      const mockUserAchievement = {
        id: 'userAchievement1',
        status: 'UNLOCKED',
        rewardClaimed: false,
        achievement: {
          rewardId: 'reward1',
        },
        reward: {
          id: 'reward1',
          type: RewardType.AVATAR_ASSET,
          avatarAssetId: 'asset1',
        },
      };

      mockPrismaService.userAchievement.findUnique.mockResolvedValue(
        mockUserAchievement
      );
      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue({
        id: 'existingAsset',
        userId: 'user1',
        assetId: 'asset1',
      });

      await expect(
        service.claimReward('user1', 'achievement1')
      ).rejects.toThrow('User already owns this avatar asset');
    });
  });

  describe('createReward', () => {
    it('should create a DojoCoins reward', async () => {
      const rewardData = {
        name: 'Bonus Coins',
        description: 'Extra DojoCoins',
        type: RewardType.DOJO_COINS,
        dojoCoinAmount: 50,
      };

      const mockReward = {
        id: 'reward1',
        ...rewardData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.reward.create.mockResolvedValue(mockReward);

      const result = await service.createReward(rewardData);

      expect(result.type).toBe(RewardType.DOJO_COINS);
      expect(result.dojoCoinAmount).toBe(50);
    });

    it('should create an avatar asset reward', async () => {
      const rewardData = {
        name: 'Special Hat',
        type: RewardType.AVATAR_ASSET,
        avatarAssetId: 'asset1',
      };

      const mockReward = {
        id: 'reward1',
        ...rewardData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.reward.create.mockResolvedValue(mockReward);

      const result = await service.createReward(rewardData);

      expect(result.type).toBe(RewardType.AVATAR_ASSET);
      expect(result.avatarAssetId).toBe('asset1');
    });

    it('should create an exclusive title reward', async () => {
      const rewardData = {
        name: 'Champion Title',
        type: RewardType.EXCLUSIVE_TITLE,
        title: 'Champion',
      };

      const mockReward = {
        id: 'reward1',
        ...rewardData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.reward.create.mockResolvedValue(mockReward);

      const result = await service.createReward(rewardData);

      expect(result.type).toBe(RewardType.EXCLUSIVE_TITLE);
      expect(result.title).toBe('Champion');
    });
  });

  describe('getUserClaimedRewards', () => {
    it('should return user claimed rewards', async () => {
      const mockUserAchievements = [
        {
          rewardClaimed: true,
          reward: {
            id: 'reward1',
            name: 'Test Reward',
            type: RewardType.DOJO_COINS,
          },
        },
        {
          rewardClaimed: false,
          reward: null,
        },
      ];

      mockPrismaService.userAchievement.findMany.mockResolvedValue(
        mockUserAchievements
      );

      const result = await service.getUserClaimedRewards('user1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Reward');
    });
  });

  describe('getRewardStats', () => {
    it('should return reward statistics', async () => {
      const mockRewardsByType = [
        { type: RewardType.DOJO_COINS, _count: { type: 5 } },
        { type: RewardType.AVATAR_ASSET, _count: { type: 3 } },
      ];

      const mockMostClaimed = [
        { rewardId: 'reward1', _count: { rewardId: 10 } },
        { rewardId: 'reward2', _count: { rewardId: 8 } },
      ];

      const mockRewardDetails = [
        { name: 'Popular Reward' },
        { name: 'Another Reward' },
      ];

      mockPrismaService.reward.count.mockResolvedValue(15);
      mockPrismaService.reward.groupBy.mockResolvedValue(mockRewardsByType);
      mockPrismaService.userAchievement.groupBy.mockResolvedValue(
        mockMostClaimed
      );
      mockPrismaService.reward.findUnique
        .mockResolvedValueOnce(mockRewardDetails[0])
        .mockResolvedValueOnce(mockRewardDetails[1]);

      const result = await service.getRewardStats();

      expect(result.totalRewards).toBe(15);
      expect(result.rewardsByType.DOJO_COINS).toBe(5);
      expect(result.rewardsByType.AVATAR_ASSET).toBe(3);
      expect(result.mostClaimedRewards).toHaveLength(2);
      expect(result.mostClaimedRewards[0].name).toBe('Popular Reward');
    });
  });
});
