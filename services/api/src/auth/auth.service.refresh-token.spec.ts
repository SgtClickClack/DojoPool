import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

describe('AuthService - Refresh Token Rotation', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let cacheService: CacheService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    role: 'USER',
    email: 'test@example.com',
  };

  const mockRefreshToken = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
              findMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            exists: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with rotation', async () => {
      const refreshToken = 'valid-refresh-token';
      const deviceId = 'device-123';
      const deviceInfo = '{"browser": "Chrome"}';

      // Mock token hash calculation
      jest.spyOn(crypto, 'createHash').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token'),
      } as any);

      // Mock database lookup
      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockRefreshToken);

      // Mock Redis blocklist check
      jest.spyOn(cacheService, 'exists').mockResolvedValue(false);

      // Mock token revocation
      jest.spyOn(prismaService.refreshToken, 'update').mockResolvedValue(mockRefreshToken);

      // Mock Redis blocklist addition
      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      // Mock new token issuance
      jest.spyOn(service as any, 'issueTokens').mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });

      const result = await service.refreshToken(refreshToken, deviceId, deviceInfo);

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });

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

      jest.spyOn(crypto, 'createHash').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token'),
      } as any);

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(expiredToken);

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

      jest.spyOn(crypto, 'createHash').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token'),
      } as any);

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(revokedToken);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should reject token in Redis blocklist', async () => {
      const refreshToken = 'blocked-refresh-token';

      jest.spyOn(crypto, 'createHash').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token'),
      } as any);

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockRefreshToken);
      jest.spyOn(cacheService, 'exists').mockResolvedValue(true);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should reject token with device mismatch', async () => {
      const refreshToken = 'device-mismatch-token';
      const deviceId = 'different-device';

      jest.spyOn(crypto, 'createHash').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token'),
      } as any);

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockRefreshToken);
      jest.spyOn(cacheService, 'exists').mockResolvedValue(false);

      await expect(service.refreshToken(refreshToken, deviceId)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should clean up expired and revoked tokens', async () => {
      jest.spyOn(prismaService.refreshToken, 'deleteMany').mockResolvedValue({
        count: 5,
      });

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { isRevoked: true },
          ],
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

      jest.spyOn(prismaService.refreshToken, 'updateMany').mockResolvedValue({
        count: 3,
      });

      jest.spyOn(prismaService.refreshToken, 'findMany').mockResolvedValue(userTokens as any);

      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);

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
