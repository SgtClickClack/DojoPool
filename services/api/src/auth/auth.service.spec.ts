import { vi } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TestDependencyInjector } from '../__tests__/utils/test-dependency-injector';
import { User } from '@prisma/client';

// Mock the Prisma client to include required exports
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashedpassword'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: vi.Mocked<PrismaService>;
  let jwtService: vi.Mocked<JwtService>;
  let cacheService: vi.Mocked<CacheService>;

  // Create mock data
  const mockUser: User = {
    id: '1',
    username: 'testuser',
    role: 'USER',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
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
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    cacheService = module.get(CacheService);

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

    // Update the module references to use the mocks
    prismaService = mockPrismaService;
    jwtService = mockJwtService;
    cacheService = mockCacheService;
  });

  afterEach(() => {
    // Clear all mocks after each test
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser as User);
      prismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        deviceId: null,
        deviceInfo: null,
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jwtService.signAsync.mockResolvedValue('jwt-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerDto.email.toLowerCase() },
            { username: registerDto.username },
          ],
        },
      });
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(mockUser as User);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException
      );
      expect(prismaService.user.findFirst).toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for missing required fields', async () => {
      // Act & Assert
      await expect(
        service.register({} as unknown as RegisterDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      usernameOrEmail: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(mockUser as User);
      prismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        deviceId: null,
        deviceInfo: null,
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jwtService.signAsync.mockResolvedValue('jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: loginDto.usernameOrEmail.toLowerCase() },
            { username: loginDto.usernameOrEmail },
          ],
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(mockUser as User);
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const mockRefreshToken = {
        id: 'token-1',
        userId: '1',
        tokenHash: 'hash',
        deviceId: null,
        deviceInfo: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      prismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      prismaService.refreshToken.update.mockResolvedValue(mockRefreshToken);
      prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);
      cacheService.exists.mockResolvedValue(false);
      cacheService.set.mockResolvedValue(undefined);
      jwtService.signAsync.mockResolvedValue('new-jwt-token');

      // Act
      const result = await service.refreshToken('refresh-token');

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(prismaService.refreshToken.findUnique).toHaveBeenCalled();
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2); // access + refresh tokens
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      prismaService.refreshToken.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('Google OAuth', () => {
    it('should generate Google OAuth URL', async () => {
      // Act
      const result = await service.getGoogleAuthUrl();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain(
        'http://localhost:3002/api/v1/auth/google/callback'
      );
    });

    it('should handle Google OAuth callback', async () => {
      // Arrange
      const mockGoogleTokenResponse: {
        access_token: string;
        id_token: string;
      } = {
        access_token: 'google-access-token',
        id_token: 'google-id-token',
      };

      const mockGoogleUserInfo: {
        sub: string;
        email: string;
        name: string;
        picture: string;
      } = {
        sub: 'google-user-id',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg',
      };

      // Mock axios calls
      vi.spyOn(require('axios'), 'post').mockResolvedValue({
        data: mockGoogleTokenResponse,
      });

      vi.spyOn(require('axios'), 'get').mockResolvedValue({
        data: mockGoogleUserInfo,
      });

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: 'google@example.com',
        username: 'googleuser',
      } as User);
      prismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        deviceId: null,
        deviceInfo: null,
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jwtService.signAsync.mockResolvedValue('jwt-token');

      // Act
      const result = await service.handleGoogleCallback('auth-code');

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should handle existing Google user login', async () => {
      // Arrange
      const mockGoogleTokenResponse: {
        access_token: string;
        id_token: string;
      } = {
        access_token: 'google-access-token',
        id_token: 'google-id-token',
      };

      const mockGoogleUserInfo: {
        sub: string;
        email: string;
        name: string;
        picture: string;
      } = {
        sub: 'google-user-id',
        email: 'test@example.com', // Existing user email
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg',
      };

      vi.spyOn(require('axios'), 'post').mockResolvedValue({
        data: mockGoogleTokenResponse,
      });

      vi.spyOn(require('axios'), 'get').mockResolvedValue({
        data: mockGoogleUserInfo,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser as User);
      prismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        deviceId: null,
        deviceInfo: null,
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jwtService.signAsync.mockResolvedValue('jwt-token');

      // Act
      const result = await service.handleGoogleCallback('auth-code');

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });
});
