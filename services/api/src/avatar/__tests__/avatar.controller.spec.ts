import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AvatarController } from '../avatar.controller';
import { AvatarService } from '../avatar.service';

describe('AvatarController', () => {
  let controller: AvatarController;
  let service: AvatarService;

  const mockAvatarService = {
    getAllAssets: jest.fn(),
    getAssetsByType: jest.fn(),
    getUserAvatar: jest.fn(),
    getUserAssets: jest.fn(),
    customizeAvatar: jest.fn(),
    purchaseAsset: jest.fn(),
    awardAsset: jest.fn(),
    resetAvatar: jest.fn(),
    unlockFeature: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'test-user-id' };
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvatarController],
      providers: [
        {
          provide: AvatarService,
          useValue: mockAvatarService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AvatarController>(AvatarController);
    service = module.get<AvatarService>(AvatarService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAssets', () => {
    it('should return all assets when no type specified', async () => {
      const mockAssets = [
        { id: '1', name: 'Hair 1', type: 'HAIR' },
        { id: '2', name: 'Shirt 1', type: 'CLOTHES_TOP' },
      ];

      mockAvatarService.getAllAssets.mockResolvedValue(mockAssets);

      const result = await controller.getAllAssets();

      expect(result).toEqual(mockAssets);
      expect(mockAvatarService.getAllAssets).toHaveBeenCalled();
    });

    it('should return assets filtered by type', async () => {
      const mockAssets = [{ id: '1', name: 'Hair 1', type: 'HAIR' }];

      mockAvatarService.getAssetsByType.mockResolvedValue(mockAssets);

      const result = await controller.getAllAssets('HAIR');

      expect(result).toEqual(mockAssets);
      expect(mockAvatarService.getAssetsByType).toHaveBeenCalledWith('HAIR');
    });
  });

  describe('getMyAvatar', () => {
    it('should return current user avatar', async () => {
      const mockAvatar = {
        id: 'avatar-1',
        userId: 'test-user-id',
        configuration: {},
      };

      mockAvatarService.getUserAvatar.mockResolvedValue(mockAvatar);

      const mockRequest = { user: { id: 'test-user-id' } };
      const result = await controller.getMyAvatar(mockRequest);

      expect(result).toEqual(mockAvatar);
      expect(mockAvatarService.getUserAvatar).toHaveBeenCalledWith(
        'test-user-id'
      );
    });
  });

  describe('getPlayerAvatar', () => {
    it('should return specified player avatar', async () => {
      const playerId = 'player-1';
      const mockAvatar = {
        id: 'avatar-1',
        userId: playerId,
        configuration: {},
      };

      mockAvatarService.getUserAvatar.mockResolvedValue(mockAvatar);

      const result = await controller.getPlayerAvatar(playerId);

      expect(result).toEqual(mockAvatar);
      expect(mockAvatarService.getUserAvatar).toHaveBeenCalledWith(playerId);
    });
  });

  describe('customizeAvatar', () => {
    it('should customize user avatar', async () => {
      const customizationData = {
        hair: 'hair-1',
        skinTone: '#8B4513',
      };

      const mockResponse = {
        success: true,
        avatar: { id: 'avatar-1', configuration: customizationData },
        message: 'Avatar customized successfully',
      };

      mockAvatarService.customizeAvatar.mockResolvedValue(mockResponse);

      const mockRequest = { user: { id: 'test-user-id' } };
      const result = await controller.customizeAvatar(
        mockRequest,
        customizationData
      );

      expect(result).toEqual(mockResponse);
      expect(mockAvatarService.customizeAvatar).toHaveBeenCalledWith(
        'test-user-id',
        customizationData
      );
    });

    it('should validate customization data - invalid bodyType', async () => {
      const invalidData = {
        bodyType: 'invalid_type',
      };

      const mockRequest = { user: { id: 'test-user-id' } };

      await expect(
        controller.customizeAvatar(mockRequest, invalidData)
      ).rejects.toThrow('Invalid bodyType: invalid_type');
    });

    it('should validate customization data - invalid skinTone', async () => {
      const invalidData = {
        skinTone: '#invalid',
      };

      const mockRequest = { user: { id: 'test-user-id' } };

      await expect(
        controller.customizeAvatar(mockRequest, invalidData)
      ).rejects.toThrow('Invalid skinTone: #invalid');
    });

    it('should validate customization data - invalid height', async () => {
      const invalidData = {
        height: 3.0, // Too tall
      };

      const mockRequest = { user: { id: 'test-user-id' } };

      await expect(
        controller.customizeAvatar(mockRequest, invalidData)
      ).rejects.toThrow('Height must be between 0.5 and 2.5');
    });

    it('should validate customization data - invalid field', async () => {
      const invalidData = {
        invalidField: 'value',
      };

      const mockRequest = { user: { id: 'test-user-id' } };

      await expect(
        controller.customizeAvatar(mockRequest, invalidData as any)
      ).rejects.toThrow('Invalid customization field: invalidField');
    });
  });

  describe('getMyAssets', () => {
    it('should return current user assets', async () => {
      const mockAssets = [
        { id: '1', assetId: 'hair-1', isEquipped: true },
        { id: '2', assetId: 'shirt-1', isEquipped: false },
      ];

      mockAvatarService.getUserAssets.mockResolvedValue(mockAssets);

      const mockRequest = { user: { id: 'test-user-id' } };
      const result = await controller.getMyAssets(mockRequest);

      expect(result).toEqual(mockAssets);
      expect(mockAvatarService.getUserAssets).toHaveBeenCalledWith(
        'test-user-id'
      );
    });
  });

  describe('purchaseAsset', () => {
    it('should purchase asset for user', async () => {
      const assetId = 'asset-1';
      const mockResponse = {
        id: 'ownership-1',
        userId: 'test-user-id',
        assetId,
        acquiredVia: 'purchase',
      };

      mockAvatarService.purchaseAsset.mockResolvedValue(mockResponse);

      const mockRequest = { user: { id: 'test-user-id' } };
      const result = await controller.purchaseAsset(mockRequest, { assetId });

      expect(result).toEqual(mockResponse);
      expect(mockAvatarService.purchaseAsset).toHaveBeenCalledWith(
        'test-user-id',
        assetId
      );
    });

    it('should throw error when assetId is missing', async () => {
      const mockRequest = { user: { id: 'test-user-id' } };

      await expect(
        controller.purchaseAsset(mockRequest, { assetId: '' })
      ).rejects.toThrow('assetId is required');
    });
  });

  describe('awardAsset', () => {
    it('should award asset to specified user', async () => {
      const userId = 'target-user';
      const assetId = 'asset-1';
      const reason = 'achievement';
      const mockResponse = {
        id: 'ownership-1',
        userId,
        assetId,
        acquiredVia: reason,
      };

      mockAvatarService.awardAsset.mockResolvedValue(mockResponse);

      const result = await controller.awardAsset(null as any, {
        userId,
        assetId,
        reason,
      });

      expect(result).toEqual(mockResponse);
      expect(mockAvatarService.awardAsset).toHaveBeenCalledWith(
        userId,
        assetId,
        reason
      );
    });

    it('should throw error when required fields are missing', async () => {
      await expect(
        controller.awardAsset(null as any, {
          userId: '',
          assetId: 'asset-1',
        })
      ).rejects.toThrow('userId and assetId are required');
    });
  });

  describe('resetAvatar', () => {
    it('should reset user avatar to default', async () => {
      const mockResponse = {
        id: 'avatar-1',
        configuration: {},
        skinTone: '#F5DEB3',
      };

      mockAvatarService.resetAvatar.mockResolvedValue(mockResponse);

      const mockRequest = { user: { id: 'test-user-id' } };
      const result = await controller.resetAvatar(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockAvatarService.resetAvatar).toHaveBeenCalledWith(
        'test-user-id'
      );
    });
  });

  describe('unlockFeature', () => {
    it('should unlock avatar feature for user', async () => {
      const feature = 'advanced_hair';
      const mockResponse = {
        id: 'avatar-1',
        unlockedFeatures: ['basic_customization', 'advanced_hair'],
      };

      mockAvatarService.unlockFeature.mockResolvedValue(mockResponse);

      const mockRequest = { user: { id: 'test-user-id' } };
      const result = await controller.unlockFeature(mockRequest, { feature });

      expect(result).toEqual(mockResponse);
      expect(mockAvatarService.unlockFeature).toHaveBeenCalledWith(
        'test-user-id',
        feature
      );
    });

    it('should throw error when feature is missing', async () => {
      const mockRequest = { user: { id: 'test-user-id' } };

      await expect(
        controller.unlockFeature(mockRequest, { feature: '' })
      ).rejects.toThrow('feature is required');
    });
  });
});
