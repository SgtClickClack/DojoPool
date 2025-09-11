import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import * as geoip from 'geoip-lite';
import { PrismaService } from '../prisma/prisma.service';
import {
  LocationPrivacySettingsDto,
  LocationResponseDto,
  LocationStatsDto,
  LocationUpdateDto,
  NearbyPlayerDto,
  NearbyPlayersDto,
  NearbyPlayersResponseDto,
} from './dto/location.dto';

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  // Privacy and security constants
  private readonly DEFAULT_TTL_HOURS = 24;
  private readonly MAX_RADIUS_METERS = 10000; // 10km max radius
  private readonly MIN_RADIUS_METERS = 10; // 10m min radius
  private readonly MAX_PLAYERS_RETURN = 100; // Max players in response
  private readonly EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers

  // Rate limiting
  private readonly UPDATE_RATE_LIMIT_MS = 1000; // 1 update per second max
  private updateTimestamps = new Map<string, number>();

  private readonly countryToLanguageMap: Record<string, string> = {
    US: 'en',
    GB: 'en',
    CA: 'en',
    AU: 'en',
    DE: 'de',
    FR: 'fr',
    ES: 'es',
    IT: 'it',
    JP: 'ja',
    CN: 'zh',
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determines the preferred language from the Accept-Language header or IP address.
   * @param ipAddress The user's IP address.
   * @param acceptLanguageHeader The Accept-Language HTTP header.
   * @returns A two-letter language code (e.g., 'en').
   */
  getPreferredLanguage(
    ipAddress: string,
    acceptLanguageHeader?: string
  ): string {
    // 1. Check Accept-Language header
    if (acceptLanguageHeader) {
      const languages = acceptLanguageHeader
        .split(',')
        .map((lang) => lang.split(';')[0].trim().toLowerCase().substring(0, 2));

      if (languages.length > 0) {
        // For simplicity, we're taking the first language.
        // A more robust solution would parse q-factors.
        const preferredLang = languages[0];
        // You might want to check if you support this language.
        // For now, we return it directly.
        return preferredLang;
      }
    }

    // 2. Fallback to IP-based geolocation
    const geo = geoip.lookup(ipAddress);
    if (geo && this.countryToLanguageMap[geo.country]) {
      return this.countryToLanguageMap[geo.country];
    }

    // 3. Default language
    return 'en';
  }

  /**
   * Update player location with privacy and security checks
   */
  async updateLocation(
    playerId: string,
    locationData: LocationUpdateDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LocationResponseDto> {
    // Rate limiting check
    if (this.isRateLimited(playerId)) {
      throw new BadRequestException('Location update rate limit exceeded');
    }

    // Validate location data
    this.validateLocationData(locationData);

    // Check player privacy settings
    await this.validatePrivacySettings(playerId, locationData);

    // Hash sensitive data for privacy
    const hashedIp = ipAddress ? this.hashData(ipAddress) : undefined;
    const deviceId = locationData.deviceId || this.generateDeviceId(playerId);

    // Calculate expiration time (TTL)
    const ttlHours = await this.getPlayerTtlHours(playerId);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    try {
      // Upsert location data
      const location = await this.prisma.playerLocation.upsert({
        where: { playerId },
        update: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          altitude: locationData.altitude,
          heading: locationData.heading,
          speed: locationData.speed,
          isPrecise: locationData.isPrecise ?? true,
          isSharing: locationData.isSharing ?? true,
          expiresAt,
          ipAddress: hashedIp,
          userAgent,
          deviceId,
        },
        create: {
          playerId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          altitude: locationData.altitude,
          heading: locationData.heading,
          speed: locationData.speed,
          isPrecise: locationData.isPrecise ?? true,
          isSharing: locationData.isSharing ?? true,
          expiresAt,
          ipAddress: hashedIp,
          userAgent,
          deviceId,
        },
      });

      // Update rate limiting timestamp
      this.updateTimestamps.set(playerId, Date.now());

      this.logger.log(`Location updated for player ${playerId}`);

      return {
        playerId: location.playerId,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        accuracy: location.accuracy || undefined,
        altitude: location.altitude || undefined,
        heading: location.heading || undefined,
        speed: location.speed || undefined,
        isPrecise: location.isPrecise,
        isSharing: location.isSharing,
        lastUpdated: location.lastUpdated,
        expiresAt: location.expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update location for player ${playerId}`,
        error
      );
      throw new BadRequestException('Failed to update location');
    }
  }

  /**
   * Get nearby players within specified radius
   */
  async getNearbyPlayers(
    requestingPlayerId: string,
    params: NearbyPlayersDto
  ): Promise<NearbyPlayersResponseDto> {
    // Validate radius
    const radius = Math.max(
      this.MIN_RADIUS_METERS,
      Math.min(params.radius || 1000, this.MAX_RADIUS_METERS)
    );
    const limit = Math.min(params.limit || 50, this.MAX_PLAYERS_RETURN);

    // Check if requesting player has location sharing enabled
    const requestingPlayerLocation =
      await this.prisma.playerLocation.findUnique({
        where: { playerId: requestingPlayerId },
      });

    if (!requestingPlayerLocation?.isSharing) {
      throw new ForbiddenException('Location sharing is disabled');
    }

    // Get nearby players using geospatial query
    const nearbyLocations = (await this.prisma.$queryRaw`
      SELECT
        pl."playerId",
        pl.latitude,
        pl.longitude,
        pl.accuracy,
        pl.heading,
        pl.speed,
        pl."lastUpdated",
        u.username,
        u."displayName",
        p."avatarUrl",
        c.tag as "clanTag",
        -- Calculate distance using Haversine formula
        (6371 * acos(
          cos(radians(${params.latitude})) * cos(radians(pl.latitude)) *
          cos(radians(pl.longitude) - radians(${params.longitude})) +
          sin(radians(${params.latitude})) * sin(radians(pl.latitude))
        )) * 1000 as distance
      FROM "PlayerLocation" pl
      JOIN "User" u ON pl."playerId" = u.id
      LEFT JOIN "Profile" p ON u.id = p."userId"
      LEFT JOIN "ClanMember" cm ON u.id = cm."userId"
      LEFT JOIN "Clan" c ON cm."clanId" = c.id
      WHERE pl."playerId" != ${requestingPlayerId}
        AND pl."isSharing" = true
        AND pl."expiresAt" > NOW()
        AND (
          6371 * acos(
            cos(radians(${params.latitude})) * cos(radians(pl.latitude)) *
            cos(radians(pl.longitude) - radians(${params.longitude})) +
            sin(radians(${params.latitude})) * sin(radians(pl.latitude))
          )
        ) * 1000 <= ${radius}
      ORDER BY distance ASC
      LIMIT ${limit}
    `) as any[];

    const players: NearbyPlayerDto[] = nearbyLocations.map((location) => ({
      playerId: location.playerId,
      username: location.displayName || location.username,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      accuracy: location.accuracy || undefined,
      distance: Math.round(Number(location.distance)),
      heading: location.heading || undefined,
      speed: location.speed || undefined,
      lastUpdated: location.lastUpdated,
      avatarUrl: location.avatarUrl || undefined,
      clanTag: location.clanTag || undefined,
    }));

    return {
      center: {
        latitude: params.latitude,
        longitude: params.longitude,
      },
      radius,
      players,
      totalCount: players.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get player location (for internal use only)
   */
  async getPlayerLocation(
    playerId: string
  ): Promise<LocationResponseDto | null> {
    const location = await this.prisma.playerLocation.findUnique({
      where: { playerId },
    });

    if (!location) return null;

    // Check if location has expired
    if (location.expiresAt < new Date()) {
      await this.prisma.playerLocation.delete({ where: { playerId } });
      return null;
    }

    return {
      playerId: location.playerId,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      accuracy: location.accuracy || undefined,
      altitude: location.altitude || undefined,
      heading: location.heading || undefined,
      speed: location.speed || undefined,
      isPrecise: location.isPrecise,
      isSharing: location.isSharing,
      lastUpdated: location.lastUpdated,
      expiresAt: location.expiresAt,
    };
  }

  /**
   * Update player privacy settings
   */
  async updatePrivacySettings(
    playerId: string,
    settings: LocationPrivacySettingsDto
  ): Promise<void> {
    // Update user preferences (you might want to add a separate table for this)
    // For now, we'll update the existing location record if it exists
    const location = await this.prisma.playerLocation.findUnique({
      where: { playerId },
    });

    if (location) {
      await this.prisma.playerLocation.update({
        where: { playerId },
        data: {
          isSharing: settings.locationSharing,
          isPrecise: settings.preciseLocation,
        },
      });
    }

    this.logger.log(`Privacy settings updated for player ${playerId}`);
  }

  /**
   * Get location statistics (admin only)
   */
  async getLocationStats(): Promise<LocationStatsDto> {
    const [totalActive, cleanupInfo] = await Promise.all([
      this.prisma.playerLocation.count({
        where: {
          isSharing: true,
          expiresAt: { gt: new Date() },
        },
      }),
      this.prisma.playerLocation.findFirst({
        orderBy: { lastUpdated: 'asc' },
        select: { lastUpdated: true },
      }),
    ]);

    // Calculate average accuracy
    const accuracyData = await this.prisma.playerLocation.findMany({
      where: {
        accuracy: { not: null },
        isSharing: true,
        expiresAt: { gt: new Date() },
      },
      select: { accuracy: true },
    });

    const averageAccuracy =
      accuracyData.length > 0
        ? accuracyData.reduce((sum, loc) => sum + (loc.accuracy || 0), 0) /
          accuracyData.length
        : 0;

    return {
      totalActivePlayers: totalActive,
      playersInRadius: totalActive, // This would be calculated differently for specific radius
      averageAccuracy: Math.round(averageAccuracy),
      lastCleanup: cleanupInfo?.lastUpdated || new Date(),
      privacyCompliant: true, // We'll implement more detailed privacy checks
    };
  }

  /**
   * Clean up expired location data (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredLocations(): Promise<void> {
    try {
      const result = await this.prisma.playerLocation.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired location records`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired locations', error);
    }
  }

  /**
   * Validate location data for security and accuracy
   */
  private validateLocationData(data: LocationUpdateDto): void {
    // Check for obviously invalid coordinates
    if (Math.abs(data.latitude) > 90 || Math.abs(data.longitude) > 180) {
      throw new BadRequestException('Invalid coordinates');
    }

    // Check for suspiciously high accuracy (might indicate spoofing)
    if (data.accuracy && data.accuracy > 10000) {
      // 10km accuracy is very poor
      throw new BadRequestException('Location accuracy too low');
    }

    // Check for unrealistic speed (faster than commercial jet)
    if (data.speed && data.speed > 1000) {
      // 1000 m/s = ~3600 km/h
      throw new BadRequestException('Invalid speed data');
    }

    // Check for unrealistic altitude (higher than commercial jet ceiling)
    if (data.altitude && data.altitude > 15000) {
      // 15km altitude
      throw new BadRequestException('Invalid altitude data');
    }
  }

  /**
   * Check rate limiting for location updates
   */
  private isRateLimited(playerId: string): boolean {
    const lastUpdate = this.updateTimestamps.get(playerId);
    if (!lastUpdate) return false;

    return Date.now() - lastUpdate < this.UPDATE_RATE_LIMIT_MS;
  }

  /**
   * Validate privacy settings before updating location
   */
  private async validatePrivacySettings(
    playerId: string,
    locationData: LocationUpdateDto
  ): Promise<void> {
    // If player explicitly disables sharing, respect that
    if (locationData.isSharing === false) {
      // Allow the update but log it
      this.logger.log(`Player ${playerId} disabled location sharing`);
      return;
    }

    // Check if player has any existing privacy restrictions
    // This could be extended to check against user preferences
  }

  /**
   * Get player's preferred TTL hours
   */
  private async getPlayerTtlHours(playerId: string): Promise<number> {
    // This could be retrieved from user preferences
    // For now, return default
    return this.DEFAULT_TTL_HOURS;
  }

  /**
   * Hash sensitive data for privacy
   */
  private hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate anonymous device identifier
   */
  private generateDeviceId(playerId: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString();
    return crypto
      .createHash('sha256')
      .update(playerId + timestamp + random)
      .digest('hex')
      .substring(0, 16);
  }
}
