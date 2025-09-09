import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { GeolocationService } from '../geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    playerLocation: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeolocationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GeolocationService>(GeolocationService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear rate limiting cache
    (service as any).updateTimestamps.clear();
  });

  describe('updateLocation', () => {
    const mockLocationData = {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      altitude: 100,
      heading: 90,
      speed: 5,
      isPrecise: true,
      isSharing: true,
    };

    it('should update location successfully', async () => {
      const mockUpsertedLocation = {
        playerId: 'user1',
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        isPrecise: true,
        isSharing: true,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      mockPrismaService.playerLocation.upsert.mockResolvedValue(
        mockUpsertedLocation
      );

      const result = await service.updateLocation('user1', mockLocationData);

      expect(result.playerId).toBe('user1');
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
      expect(mockPrismaService.playerLocation.upsert).toHaveBeenCalledWith({
        where: { playerId: 'user1' },
        update: expect.objectContaining({
          latitude: 40.7128,
          longitude: -74.006,
          isPrecise: true,
          isSharing: true,
        }),
        create: expect.any(Object),
      });
    });

    it('should validate location data and reject invalid coordinates', async () => {
      const invalidLocationData = {
        ...mockLocationData,
        latitude: 91, // Invalid latitude
      };

      await expect(
        service.updateLocation('user1', invalidLocationData)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject suspiciously high accuracy', async () => {
      const suspiciousLocationData = {
        ...mockLocationData,
        accuracy: 20000, // 20km accuracy is too poor
      };

      await expect(
        service.updateLocation('user1', suspiciousLocationData)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unrealistic speed', async () => {
      const unrealisticLocationData = {
        ...mockLocationData,
        speed: 2000, // 2000 m/s is faster than commercial jets
      };

      await expect(
        service.updateLocation('user1', unrealisticLocationData)
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash sensitive IP addresses', async () => {
      const mockUpsertedLocation = {
        playerId: 'user1',
        latitude: 40.7128,
        longitude: -74.006,
        lastUpdated: new Date(),
        expiresAt: new Date(),
      };

      mockPrismaService.playerLocation.upsert.mockResolvedValue(
        mockUpsertedLocation
      );

      await service.updateLocation('user1', mockLocationData, '192.168.1.1');

      expect(mockPrismaService.playerLocation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            ipAddress: expect.any(String), // Should be hashed
          }),
          create: expect.objectContaining({
            ipAddress: expect.any(String), // Should be hashed
          }),
        })
      );
    });

    it('should enforce rate limiting', async () => {
      // First call should succeed
      mockPrismaService.playerLocation.upsert.mockResolvedValue({
        playerId: 'user1',
        latitude: 40.7128,
        longitude: -74.006,
        lastUpdated: new Date(),
        expiresAt: new Date(),
      });

      await service.updateLocation('user1', mockLocationData);

      // Second call immediately after should fail
      await expect(
        service.updateLocation('user1', mockLocationData)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getNearbyPlayers', () => {
    const mockParams = {
      latitude: 40.7128,
      longitude: -74.006,
      radius: 1000,
      limit: 50,
    };

    it('should return nearby players successfully', async () => {
      const mockNearbyPlayers = [
        {
          playerId: 'user2',
          username: 'Player2',
          latitude: 40.7129,
          longitude: -74.0061,
          accuracy: 5,
          heading: 45,
          speed: 1.5,
          lastUpdated: new Date(),
          distance: 150,
        },
      ];

      const mockRawQueryResult = mockNearbyPlayers;
      mockPrismaService.$queryRaw.mockResolvedValue(mockRawQueryResult);

      // Mock requesting player's location
      mockPrismaService.playerLocation.findUnique.mockResolvedValue({
        playerId: 'user1',
        latitude: 40.7128,
        longitude: -74.006,
        isSharing: true,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const result = await service.getNearbyPlayers('user1', mockParams);

      expect(result.players).toHaveLength(1);
      expect(result.players[0].playerId).toBe('user2');
      expect(result.center.latitude).toBe(40.7128);
      expect(result.center.longitude).toBe(-74.006);
      expect(result.radius).toBe(1000);
    });

    it('should reject requests from players not sharing location', async () => {
      mockPrismaService.playerLocation.findUnique.mockResolvedValue({
        playerId: 'user1',
        isSharing: false,
        lastUpdated: new Date(),
        expiresAt: new Date(),
      });

      await expect(
        service.getNearbyPlayers('user1', mockParams)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should enforce radius limits', async () => {
      const oversizedRadiusParams = {
        ...mockParams,
        radius: 20000, // 20km, over the limit
      };

      mockPrismaService.playerLocation.findUnique.mockResolvedValue({
        playerId: 'user1',
        isSharing: true,
        lastUpdated: new Date(),
        expiresAt: new Date(),
      });

      const result = await service.getNearbyPlayers(
        'user1',
        oversizedRadiusParams
      );

      // Should be clamped to MAX_RADIUS_METERS
      expect(result.radius).toBeLessThanOrEqual(10000);
    });

    it('should limit number of returned players', async () => {
      const highLimitParams = {
        ...mockParams,
        limit: 200, // Over the limit
      };

      const mockManyPlayers = Array.from({ length: 150 }, (_, i) => ({
        playerId: `user${i + 2}`,
        username: `Player${i + 2}`,
        latitude: 40.7128 + i * 0.001,
        longitude: -74.006 + i * 0.001,
        distance: i * 10,
        lastUpdated: new Date(),
      }));

      mockPrismaService.$queryRaw.mockResolvedValue(mockManyPlayers);
      mockPrismaService.playerLocation.findUnique.mockResolvedValue({
        playerId: 'user1',
        isSharing: true,
        lastUpdated: new Date(),
        expiresAt: new Date(),
      });

      const result = await service.getNearbyPlayers('user1', highLimitParams);

      expect(result.players.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getPlayerLocation', () => {
    it('should return player location if exists and not expired', async () => {
      const mockLocation = {
        playerId: 'user1',
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        isPrecise: true,
        isSharing: true,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      };

      mockPrismaService.playerLocation.findUnique.mockResolvedValue(
        mockLocation
      );

      const result = await service.getPlayerLocation('user1');

      expect(result).toBeDefined();
      expect(result!.playerId).toBe('user1');
      expect(result!.latitude).toBe(40.7128);
      expect(result!.longitude).toBe(-74.006);
    });

    it('should return null for expired location and clean it up', async () => {
      const mockExpiredLocation = {
        playerId: 'user1',
        latitude: 40.7128,
        longitude: -74.006,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };

      mockPrismaService.playerLocation.findUnique.mockResolvedValue(
        mockExpiredLocation
      );

      const result = await service.getPlayerLocation('user1');

      expect(result).toBeNull();
      expect(mockPrismaService.playerLocation.delete).toHaveBeenCalledWith({
        where: { playerId: 'user1' },
      });
    });

    it('should return null for non-existent location', async () => {
      mockPrismaService.playerLocation.findUnique.mockResolvedValue(null);

      const result = await service.getPlayerLocation('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Privacy and Security Features', () => {
    it('should generate consistent device IDs', () => {
      const deviceId1 = (service as any).generateDeviceId('user1');
      const deviceId2 = (service as any).generateDeviceId('user1');

      expect(deviceId1).toBe(deviceId2); // Should be consistent for same user
      expect(deviceId1).toHaveLength(16); // Should be 16 characters
      expect(typeof deviceId1).toBe('string');
    });

    it('should hash sensitive data', () => {
      const originalData = '192.168.1.100';
      const hashedData = (service as any).hashData(originalData);

      expect(hashedData).not.toBe(originalData);
      expect(hashedData).toHaveLength(64); // SHA256 produces 64 character hex string
      expect(/^[a-f0-9]+$/.test(hashedData)).toBe(true); // Should be hex
    });

    it('should validate coordinates properly', () => {
      // Valid coordinates should not throw
      expect(() =>
        (service as any).validateLocationData({
          latitude: 40.7128,
          longitude: -74.006,
        })
      ).not.toThrow();

      // Invalid latitude should throw
      expect(() =>
        (service as any).validateLocationData({
          latitude: 91,
          longitude: -74.006,
        })
      ).toThrow(BadRequestException);

      // Invalid longitude should throw
      expect(() =>
        (service as any).validateLocationData({
          latitude: 40.7128,
          longitude: 181,
        })
      ).toThrow(BadRequestException);
    });

    it('should calculate TTL hours correctly', async () => {
      // Default should be 24 hours
      const ttlHours = await (service as any).getPlayerTtlHours('user1');
      expect(ttlHours).toBe(24);
    });
  });

  describe('getLocationStats', () => {
    it('should return location statistics', async () => {
      mockPrismaService.playerLocation.count.mockResolvedValue(150);
      mockPrismaService.playerLocation.findFirst.mockResolvedValue({
        lastUpdated: new Date(),
      });
      mockPrismaService.playerLocation.findMany.mockResolvedValue([
        { accuracy: 10 },
        { accuracy: 20 },
        { accuracy: null },
      ]);

      const result = await service.getLocationStats();

      expect(result.totalActivePlayers).toBe(150);
      expect(result.averageAccuracy).toBe(15); // (10 + 20) / 2
      expect(result.privacyCompliant).toBe(true);
    });
  });

  describe('cleanupExpiredLocations', () => {
    it('should clean up expired locations', async () => {
      mockPrismaService.playerLocation.deleteMany.mockResolvedValue({
        count: 25,
      });

      await (service as any).cleanupExpiredLocations();

      expect(mockPrismaService.playerLocation.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });
  });

  describe('isRateLimited', () => {
    it('should not rate limit first request', () => {
      const isLimited = (service as any).isRateLimited('user1');
      expect(isLimited).toBe(false);
    });

    it('should rate limit subsequent requests', () => {
      // First request
      (service as any).isRateLimited('user1');

      // Update timestamp to simulate rate limiting
      (service as any).updateTimestamps.set('user1', Date.now());

      // Second request should be limited
      const isLimited = (service as any).isRateLimited('user1');
      expect(isLimited).toBe(true);
    });
  });
});
