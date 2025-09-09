import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AvatarCustomizationData, AvatarService } from './avatar.service';

@Controller('api/v1/avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  /**
   * Get all available avatar assets
   * GET /api/v1/avatar/assets
   */
  @Get('assets')
  async getAllAssets(@Query('type') type?: string) {
    if (type) {
      return this.avatarService.getAssetsByType(type);
    }
    return this.avatarService.getAllAssets();
  }

  /**
   * Get current user's avatar configuration
   * GET /api/v1/avatar/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyAvatar(@Request() req: any) {
    const userId = req.user.id;
    return this.avatarService.getUserAvatar(userId);
  }

  /**
   * Get specific user's avatar configuration
   * GET /api/v1/avatar/player/:playerId
   */
  @Get('player/:playerId')
  async getPlayerAvatar(@Param('playerId') playerId: string) {
    return this.avatarService.getUserAvatar(playerId);
  }

  /**
   * Customize current user's avatar
   * POST /api/v1/avatar/customize
   */
  @Post('customize')
  @UseGuards(JwtAuthGuard)
  async customizeAvatar(
    @Request() req: any,
    @Body() customizationData: AvatarCustomizationData
  ) {
    const userId = req.user.id;

    // Validate customization data
    this.validateCustomizationData(customizationData);

    return this.avatarService.customizeAvatar(userId, customizationData);
  }

  /**
   * Get current user's owned avatar assets
   * GET /api/v1/avatar/my-assets
   */
  @Get('my-assets')
  @UseGuards(JwtAuthGuard)
  async getMyAssets(@Request() req: any) {
    const userId = req.user.id;
    return this.avatarService.getUserAssets(userId);
  }

  /**
   * Purchase an avatar asset
   * POST /api/v1/avatar/purchase
   */
  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseAsset(@Request() req: any, @Body() body: { assetId: string }) {
    const userId = req.user.id;
    const { assetId } = body;

    if (!assetId) {
      throw new BadRequestException('assetId is required');
    }

    return this.avatarService.purchaseAsset(userId, assetId);
  }

  /**
   * Award an avatar asset to user (admin only)
   * POST /api/v1/avatar/award
   */
  @Post('award')
  @UseGuards(JwtAuthGuard)
  async awardAsset(
    @Request() req: any,
    @Body() body: { userId: string; assetId: string; reason?: string }
  ) {
    const { userId, assetId, reason } = body;

    if (!userId || !assetId) {
      throw new BadRequestException('userId and assetId are required');
    }

    return this.avatarService.awardAsset(userId, assetId, reason);
  }

  /**
   * Reset avatar to default configuration
   * POST /api/v1/avatar/reset
   */
  @Post('reset')
  @UseGuards(JwtAuthGuard)
  async resetAvatar(@Request() req: any) {
    const userId = req.user.id;
    return this.avatarService.resetAvatar(userId);
  }

  /**
   * Unlock avatar feature for user
   * POST /api/v1/avatar/unlock-feature
   */
  @Post('unlock-feature')
  @UseGuards(JwtAuthGuard)
  async unlockFeature(@Request() req: any, @Body() body: { feature: string }) {
    const userId = req.user.id;
    const { feature } = body;

    if (!feature) {
      throw new BadRequestException('feature is required');
    }

    return this.avatarService.unlockFeature(userId, feature);
  }

  /**
   * Validate customization data structure
   */
  private validateCustomizationData(data: AvatarCustomizationData) {
    const validAssetTypes = [
      'hair',
      'face',
      'clothesTop',
      'clothesBottom',
      'shoes',
      'accessoryHead',
      'accessoryNeck',
      'accessoryBack',
      'weapon',
      'pet',
      'effect',
    ];

    const validBodyTypes = ['slim', 'athletic', 'muscular', 'heavy'];
    const validSkinTones = [
      '#F5DEB3',
      '#D2B48C',
      '#BC986A',
      '#A0522D',
      '#8B4513',
      '#654321',
      '#3D2817',
      '#000000',
      '#FFF8DC',
      '#FFE4B5',
    ];

    // Validate asset IDs (should be strings if provided)
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'string') {
        if (
          !validAssetTypes.includes(key) &&
          !['skinTone', 'bodyType', 'height'].includes(key)
        ) {
          throw new BadRequestException(`Invalid customization field: ${key}`);
        }
      }
    }

    // Validate specific fields
    if (data.bodyType && !validBodyTypes.includes(data.bodyType)) {
      throw new BadRequestException(`Invalid bodyType: ${data.bodyType}`);
    }

    if (data.skinTone && !validSkinTones.includes(data.skinTone)) {
      throw new BadRequestException(`Invalid skinTone: ${data.skinTone}`);
    }

    if (data.height && (data.height < 0.5 || data.height > 2.5)) {
      throw new BadRequestException('Height must be between 0.5 and 2.5');
    }
  }
}
