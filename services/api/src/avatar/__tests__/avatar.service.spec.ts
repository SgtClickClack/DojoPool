import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AvatarService } from '../avatar.service';

describe('AvatarService', () => {
  let service: AvatarService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    avatarAsset: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    avatar: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userAvatarAsset: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    territoryEvent: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AvatarService>(AvatarService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAssets', () => {
    it('should return all active avatar assets', async () => {
      const mockAssets = [
        { id: '1', name: 'Test Hair', type: 'HAIR', isActive: true },
        { id: '2', name: 'Test Shirt', type: 'CLOTHES_TOP', isActive: true },
      ];

      mockPrismaService.avatarAsset.findMany.mockResolvedValue(mockAssets);

      const result = await service.getAllAssets();

      expect(result).toEqual(mockAssets);
      expect(mockPrismaService.avatarAsset.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { rarity: 'desc' }, { name: 'asc' }],
      });
    });
  });

  describe('getAssetsByType', () => {
    it('should return assets filtered by type', async () => {
      const mockAssets = [
        { id: '1', name: 'Test Hair', type: 'HAIR', isActive: true },
      ];

      mockPrismaService.avatarAsset.findMany.mockResolvedValue(mockAssets);

      const result = await service.getAssetsByType('HAIR');

      expect(result).toEqual(mockAssets);
      expect(mockPrismaService.avatarAsset.findMany).toHaveBeenCalledWith({
        where: {
          type: 'HAIR',
          isActive: true,
        },
        orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
      });
    });
  });

  describe('getUserAvatar', () => {
    it('should return existing user avatar', async () => {
      const userId = 'user-1';
      const mockAvatar = {
        id: 'avatar-1',
        userId,
        configuration: { hair: 'hair-1' },
        user: { id: userId, username: 'TestUser' },
      };

      mockPrismaService.avatar.findUnique.mockResolvedValue(mockAvatar);

      const result = await service.getUserAvatar(userId);

      expect(result).toEqual(mockAvatar);
    });

    it('should create default avatar if none exists', async () => {
      const userId = 'user-1';
      const mockNewAvatar = {
        id: 'avatar-1',
        userId,
        configuration: {},
        skinTone: '#F5DEB3',
        bodyType: 'athletic',
        height: 1.0,
        user: { id: userId, username: 'TestUser' },
      };

      mockPrismaService.avatar.findUnique.mockResolvedValue(null);
      mockPrismaService.avatar.create.mockResolvedValue(mockNewAvatar);

      const result = await service.getUserAvatar(userId);

      expect(result).toEqual(mockNewAvatar);
      expect(mockPrismaService.avatar.create).toHaveBeenCalledWith({
        data: {
          userId,
          configuration: {},
          skinTone: '#F5DEB3',
          bodyType: 'athletic',
          height: 1.0,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  avatarUrl: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });
    });
  });

  describe('customizeAvatar', () => {
    it('should successfully customize avatar with owned assets', async () => {
      const userId = 'user-1';
      const customizationData = {
        hair: 'hair-1',
        skinTone: '#8B4513',
        bodyType: 'muscular',
      };

      const mockAvatar = {
        id: 'avatar-1',
        userId,
        configuration: {},
        skinTone: '#F5DEB3',
        bodyType: 'athletic',
        height: 1.0,
      };

      const mockUpdatedAvatar = {
        ...mockAvatar,
        configuration: customizationData,
        skinTone: '#8B4513',
        bodyType: 'muscular',
      };

      // Mock owned assets check
      mockPrismaService.userAvatarAsset.findMany.mockResolvedValue([
        { assetId: 'hair-1', userId },
      ]);

      mockPrismaService.avatar.findUnique.mockResolvedValue(mockAvatar);
      mockPrismaService.avatar.update.mockResolvedValue(mockUpdatedAvatar);
      mockPrismaService.userAvatarAsset.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.customizeAvatar(userId, customizationData);

      expect(result.success).toBe(true);
      expect(result.avatar.configuration).toEqual(customizationData);
      expect(mockPrismaService.userAvatarAsset.updateMany).toHaveBeenCalledWith(
        {
          where: { userId, isEquipped: true },
          data: { isEquipped: false },
        }
      );
    });

    it('should throw error when user does not own required assets', async () => {
      const userId = 'user-1';
      const customizationData = {
        hair: 'hair-1', // User doesn't own this
      };

      // Mock empty owned assets
      mockPrismaService.userAvatarAsset.findMany.mockResolvedValue([]);

      await expect(
        service.customizeAvatar(userId, customizationData)
      ).rejects.toThrow('User does not own the following assets: hair-1');
    });
  });

  describe('purchaseAsset', () => {
    it('should successfully purchase an asset', async () => {
      const userId = 'user-1';
      const assetId = 'asset-1';
      const assetPrice = 100;

      const mockAsset = {
        id: assetId,
        name: 'Test Asset',
        price: assetPrice,
        isActive: true,
      };

      const mockUser = {
        id: userId,
        dojoCoinBalance: 200,
      };

      const mockOwnership = {
        id: 'ownership-1',
        userId,
        assetId,
        acquiredVia: 'purchase',
        asset: mockAsset,
      };

      mockPrismaService.avatarAsset.findUnique.mockResolvedValue(mockAsset);
      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue(null); // Not owned
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userAvatarAsset.create.mockResolvedValue(mockOwnership);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        dojoCoinBalance: 100,
      });

      const result = await service.purchaseAsset(userId, assetId);

      expect(result).toEqual(mockOwnership);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          dojoCoinBalance: { decrement: assetPrice },
        },
      });
    });

    it('should throw error when user has insufficient funds', async () => {
      const userId = 'user-1';
      const assetId = 'asset-1';

      const mockAsset = {
        id: assetId,
        price: 100,
        isActive: true,
      };

      const mockUser = {
        id: userId,
        dojoCoinBalance: 50, // Insufficient funds
      };

      mockPrismaService.avatarAsset.findUnique.mockResolvedValue(mockAsset);
      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.purchaseAsset(userId, assetId)).rejects.toThrow(
        'Insufficient DojoCoins'
      );
    });

    it('should throw error when asset is already owned', async () => {
      const userId = 'user-1';
      const assetId = 'asset-1';

      const mockAsset = {
        id: assetId,
        price: 100,
        isActive: true,
      };

      const mockOwnership = {
        id: 'ownership-1',
        userId,
        assetId,
      };

      mockPrismaService.avatarAsset.findUnique.mockResolvedValue(mockAsset);
      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue(
        mockOwnership
      );

      await expect(service.purchaseAsset(userId, assetId)).rejects.toThrow(
        'User already owns this asset'
      );
    });
  });

  describe('awardAsset', () => {
    it('should award asset to user', async () => {
      const userId = 'user-1';
      const assetId = 'asset-1';

      const mockAsset = {
        id: assetId,
        name: 'Test Asset',
      };

      const mockOwnership = {
        id: 'ownership-1',
        userId,
        assetId,
        acquiredVia: 'achievement',
        asset: mockAsset,
      };

      mockPrismaService.avatarAsset.findUnique.mockResolvedValue(mockAsset);
      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue(null); // Not owned
      mockPrismaService.userAvatarAsset.create.mockResolvedValue(mockOwnership);

      const result = await service.awardAsset(userId, assetId, 'achievement');

      expect(result).toEqual(mockOwnership);
      expect(mockPrismaService.userAvatarAsset.create).toHaveBeenCalledWith({
        data: {
          userId,
          assetId,
          acquiredVia: 'achievement',
        },
        include: {
          asset: true,
        },
      });
    });

    it('should return existing ownership if asset already owned', async () => {
      const userId = 'user-1';
      const assetId = 'asset-1';

      const mockOwnership = {
        id: 'ownership-1',
        userId,
        assetId,
        acquiredVia: 'previous',
      };

      mockPrismaService.avatarAsset.findUnique.mockResolvedValue({
        id: assetId,
      });
      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue(
        mockOwnership
      );

      const result = await service.awardAsset(userId, assetId, 'achievement');

      expect(result).toEqual(mockOwnership);
      expect(mockPrismaService.userAvatarAsset.create).not.toHaveBeenCalled();
    });
  });

  describe('resetAvatar', () => {
    it('should reset avatar to default configuration', async () => {
      const userId = 'user-1';
      const mockAvatar = {
        id: 'avatar-1',
        userId,
        configuration: { hair: 'hair-1' },
      };

      const mockResetAvatar = {
        ...mockAvatar,
        configuration: {},
        skinTone: '#F5DEB3',
        bodyType: 'athletic',
        height: 1.0,
      };

      mockPrismaService.avatar.findUnique.mockResolvedValue(mockAvatar);
      mockPrismaService.userAvatarAsset.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.avatar.update.mockResolvedValue(mockResetAvatar);

      const result = await service.resetAvatar(userId);

      expect(result).toEqual(mockResetAvatar);
      expect(mockPrismaService.userAvatarAsset.updateMany).toHaveBeenCalledWith(
        {
          where: { userId, isEquipped: true },
          data: { isEquipped: false },
        }
      );
    });
  });

  describe('unlockFeature', () => {
    it('should unlock a new avatar feature', async () => {
      const userId = 'user-1';
      const feature = 'advanced_hair';

      const mockAvatar = {
        id: 'avatar-1',
        userId,
        unlockedFeatures: ['basic_customization'],
      };

      const mockUpdatedAvatar = {
        ...mockAvatar,
        unlockedFeatures: ['basic_customization', 'advanced_hair'],
      };

      mockPrismaService.avatar.findUnique.mockResolvedValue(mockAvatar);
      mockPrismaService.avatar.update.mockResolvedValue(mockUpdatedAvatar);

      const result = await service.unlockFeature(userId, feature);

      expect(result.unlockedFeatures).toContain(feature);
      expect(mockPrismaService.avatar.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          unlockedFeatures: ['basic_customization', 'advanced_hair'],
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    });

    it('should not duplicate already unlocked features', async () => {
      const userId = 'user-1';
      const feature = 'basic_customization';

      const mockAvatar = {
        id: 'avatar-1',
        userId,
        unlockedFeatures: ['basic_customization'],
      };

      mockPrismaService.avatar.findUnique.mockResolvedValue(mockAvatar);

      const result = await service.unlockFeature(userId, feature);

      expect(result).toEqual(mockAvatar);
      expect(mockPrismaService.avatar.update).not.toHaveBeenCalled();
    });
  });
});
