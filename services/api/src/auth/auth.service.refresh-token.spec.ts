import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { User, RefreshToken } from '@prisma/client';
import { TestDependencyInjector } from '../__tests__/utils/test-dependency-injector';

// Mock the Prisma client to include required exports
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

// Mock crypto module
vi.mock('crypto', () => ({
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('hashed-token'),
  }),
}));

describe('AuthService - Refresh Token Rotation', () => {
  let service: AuthService;
  let prismaService: vi.Mocked<PrismaService>;
  let cacheService: vi.Mocked<CacheService>;
  let jwtService: vi.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-123',
    username: 'testuser',
    role: 'USER',
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
    profileId: null,
    isActive: true,
    lastLoginAt: null,
    emailVerified: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    dojoCoinBalance: 0,
  };

  const mockRefreshToken: RefreshToken & { user: User } = {
    id: 'token-123',
    userId: 'user-123',
    tokenHash: 'hashed-token',
    deviceId: 'device-123',
    deviceInfo: '{"browser": "Chrome", "os": "Windows"}',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    isRevoked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  const mockPrismaService = TestDependencyInjector.createMockPrismaService();
  const mockJwtService = {
    sign: vi.fn(),
    signAsync: vi.fn(),
    verify: vi.fn(),
    verifyAsync: vi.fn(),
    decode: vi.fn(),
  };
  const mockCacheService = TestDependencyInjector.createMockCacheService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
    jwtService = module.get<JwtService>(JwtService);

    // Use the test utility to fix dependency injection
    TestDependencyInjector.setupServiceWithMocks(service, {
      _prisma: mockPrismaService,
      _jwtService: mockJwtService,
      _cacheService: mockCacheService,
    });

    // Explicitly set the private properties to ensure proper injection
    (service as any)._prisma = mockPrismaService;
    (service as any)._jwtService = mockJwtService;
    (service as any)._cacheService = mockCacheService;
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with rotation', async () => {
      const refreshToken = 'valid-refresh-token';
      const deviceId = 'device-123';
      const deviceInfo = '{"browser": "Chrome"}';

      // Mock token hash calculation is already set up at module level

      // Mock database lookup
      vi.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(
        mockRefreshToken
      );

      // Mock Redis blocklist check
      vi.spyOn(cacheService, 'exists').mockResolvedValue(false);

      // Mock token revocation
      vi.spyOn(prismaService.refreshToken, 'update').mockResolvedValue(
        mockRefreshToken
      );

      // Mock Redis blocklist addition
      vi.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      // Mock new token issuance
      prismaService.refreshToken.create.mockResolvedValue({
        id: 'new-token-1',
        userId: 'user-123',
        tokenHash: 'new-hash',
        deviceId: 'device-123',
        deviceInfo: '{"browser": "Chrome"}',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jwtService.signAsync.mockResolvedValue('new-jwt-token');

      const result = await service.refreshToken(
        refreshToken,
        deviceId,
        deviceInfo
      );

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');

      // Verify old token was revoked
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-123' },
        data: { isRevoked: true },
      });

      // Verify old token was added to blocklist
      expect(cacheService.set).toHaveBeenCalledWith('hashed-token', true, {
        ttl: 7 * 24 * 3600,
        keyPrefix: 'auth:blocklist:',
      });
    });

    it('should reject expired refresh token', async () => {
      const refreshToken = 'expired-refresh-token';
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };

      // Mock token hash calculation is already set up at module level

      vi.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(
        expiredToken
      );

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should reject revoked refresh token', async () => {
      const refreshToken = 'revoked-refresh-token';
      const revokedToken = {
        ...mockRefreshToken,
        isRevoked: true,
      };

      // Mock token hash calculation is already set up at module level

      vi.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(
        revokedToken
      );

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should reject token in Redis blocklist', async () => {
      const refreshToken = 'blocked-refresh-token';

      // Mock token hash calculation is already set up at module level

      vi.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(
        mockRefreshToken
      );
      vi.spyOn(cacheService, 'exists').mockResolvedValue(true);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should reject token with device mismatch', async () => {
      const refreshToken = 'device-mismatch-token';
      const deviceId = 'different-device';

      // Mock token hash calculation is already set up at module level

      vi.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(
        mockRefreshToken
      );
      vi.spyOn(cacheService, 'exists').mockResolvedValue(false);

      await expect(
        service.refreshToken(refreshToken, deviceId)
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should clean up expired and revoked tokens', async () => {
      vi.spyOn(prismaService.refreshToken, 'deleteMany').mockResolvedValue({
        count: 5,
      });

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [{ expiresAt: { lt: expect.any(Date) } }, { isRevoked: true }],
        },
      });
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      const userId = 'user-123';
      const userTokens = [
        { tokenHash: 'hash1' },
        { tokenHash: 'hash2' },
        { tokenHash: 'hash3' },
      ];

      vi.spyOn(prismaService.refreshToken, 'updateMany').mockResolvedValue({
        count: 3,
      });

      vi.spyOn(prismaService.refreshToken, 'findMany').mockResolvedValue(
        userTokens as RefreshToken[]
      );

      vi.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      const result = await service.revokeAllUserTokens(userId);

      expect(result).toEqual({ message: 'All tokens revoked' });
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isRevoked: true },
      });
      expect(cacheService.set).toHaveBeenCalledTimes(3);
    });
  });
});
