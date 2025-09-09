import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Ip,
  Logger,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  LocationPrivacySettingsDto,
  LocationStatsDto,
  LocationUpdateDto,
  NearbyPlayersDto,
  NearbyPlayersResponseDto,
} from './dto/location.dto';
import { GeolocationService } from './geolocation.service';

@Controller('api/v1/location')
@UseGuards(JwtAuthGuard)
export class GeolocationController {
  private readonly logger = new Logger(GeolocationController.name);

  constructor(private readonly geolocationService: GeolocationService) {}

  /**
   * Update player location
   * POST /api/v1/location/update
   */
  @Post('update')
  async updateLocation(
    @Body() locationData: LocationUpdateDto,
    @Request() req: any,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string
  ) {
    try {
      const result = await this.geolocationService.updateLocation(
        req.user.id,
        locationData,
        ipAddress,
        userAgent
      );

      return {
        success: true,
        data: result,
        message: 'Location updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to update location for user ${req.user.id}`,
        error
      );
      throw new HttpException(
        { success: false, message: 'Failed to update location' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get nearby players
   * GET /api/v1/location/nearby-players
   */
  @Get('nearby-players')
  async getNearbyPlayers(
    @Query() query: NearbyPlayersDto,
    @Request() req: any
  ): Promise<{ success: boolean; data: NearbyPlayersResponseDto }> {
    try {
      // Validate query parameters
      if (!query.latitude || !query.longitude) {
        throw new HttpException(
          { success: false, message: 'Latitude and longitude are required' },
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.geolocationService.getNearbyPlayers(
        req.user.id,
        query
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to get nearby players for user ${req.user.id}`,
        error
      );
      throw new HttpException(
        { success: false, message: 'Failed to retrieve nearby players' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update privacy settings
   * POST /api/v1/location/privacy
   */
  @Post('privacy')
  async updatePrivacySettings(
    @Body() settings: LocationPrivacySettingsDto,
    @Request() req: any
  ) {
    try {
      await this.geolocationService.updatePrivacySettings(
        req.user.id,
        settings
      );

      return {
        success: true,
        message: 'Privacy settings updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to update privacy settings for user ${req.user.id}`,
        error
      );
      throw new HttpException(
        { success: false, message: 'Failed to update privacy settings' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get current player location (for debugging/testing)
   * GET /api/v1/location/me
   */
  @Get('me')
  async getMyLocation(@Request() req: any) {
    try {
      const location = await this.geolocationService.getPlayerLocation(
        req.user.id
      );

      if (!location) {
        return {
          success: true,
          data: null,
          message: 'No location data found',
        };
      }

      return {
        success: true,
        data: location,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get location for user ${req.user.id}`,
        error
      );
      throw new HttpException(
        { success: false, message: 'Failed to retrieve location' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get location statistics (admin only)
   * GET /api/v1/location/stats
   */
  @Get('stats')
  async getLocationStats(
    @Request() req: any
  ): Promise<{ success: boolean; data: LocationStatsDto }> {
    // TODO: Add admin role check
    // For now, allow all authenticated users (should be restricted in production)

    try {
      const stats = await this.geolocationService.getLocationStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('Failed to get location stats', error);
      throw new HttpException(
        { success: false, message: 'Failed to retrieve location statistics' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
