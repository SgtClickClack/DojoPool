import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashedpassword',
    role: 'USER' as const,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    dojoCoinBalance: 1000,
  };

  const mockProfile = {
    id: '1',
    userId: '1',
    displayName: 'Test User',
    bio: 'Test bio',
    avatarUrl: null,
    location: null,
    skillRating: 1500,
    clanTitle: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      profile: {
        create: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
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
      prismaService.user.create.mockResolvedValue(mockUser);
      prismaService.profile.create.mockResolvedValue(mockProfile);
      jwtService.sign.mockReturnValue('jwt-token');

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
      expect(prismaService.profile.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException
      );
      expect(prismaService.user.findFirst).toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for missing required fields', async () => {
      // Act & Assert
      await expect(service.register({} as RegisterDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');
      // Mock bcrypt.compare
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: loginDto.email.toLowerCase() },
            { username: loginDto.email },
          ],
        },
        include: { profile: true },
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
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      // Arrange
      const mockDecoded = { userId: '1', username: 'testuser' };
      jwtService.verify.mockReturnValue(mockDecoded);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateToken('valid-token');

      // Assert
      expect(result).toEqual(mockUser);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.validateToken('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const mockDecoded = { userId: '1', username: 'testuser' };
      jwtService.verify.mockReturnValue(mockDecoded);
      jwtService.sign.mockReturnValue('new-jwt-token');
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.refreshToken('refresh-token');

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(jwtService.verify).toHaveBeenCalledWith('refresh-token');
      expect(jwtService.sign).toHaveBeenCalledTimes(2); // access + refresh tokens
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

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
      expect(result).toHaveProperty('url');
      expect(result.url).toContain('https://accounts.google.com');
    });

    it('should handle Google OAuth callback', async () => {
      // Arrange
      const mockGoogleTokenResponse = {
        access_token: 'google-access-token',
        id_token: 'google-id-token',
      };

      const mockGoogleUserInfo = {
        sub: 'google-user-id',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg',
      };

      // Mock axios calls
      jest.spyOn(require('axios'), 'post').mockResolvedValue({
        data: mockGoogleTokenResponse,
      });

      jest.spyOn(require('axios'), 'get').mockResolvedValue({
        data: mockGoogleUserInfo,
      });

      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: 'google@example.com',
        username: 'googleuser',
      });
      jwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await service.handleGoogleCallback('auth-code');

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('google@example.com');
    });

    it('should handle existing Google user login', async () => {
      // Arrange
      const mockGoogleTokenResponse = {
        access_token: 'google-access-token',
        id_token: 'google-id-token',
      };

      const mockGoogleUserInfo = {
        sub: 'google-user-id',
        email: 'test@example.com', // Existing user email
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg',
      };

      jest.spyOn(require('axios'), 'post').mockResolvedValue({
        data: mockGoogleTokenResponse,
      });

      jest.spyOn(require('axios'), 'get').mockResolvedValue({
        data: mockGoogleUserInfo,
      });

      prismaService.user.findFirst.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await service.handleGoogleCallback('auth-code');

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result.user.id).toBe('1');
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      // Arrange
      const password = 'testpassword';
      const hashedPassword = await service.hashPassword(password);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(typeof hashedPassword).toBe('string');
    });

    it('should verify password correctly', async () => {
      // Arrange
      const password = 'testpassword';
      const hashedPassword = await service.hashPassword(password);

      // Act
      const isValid = await service.verifyPassword(password, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject invalid password', async () => {
      // Arrange
      const password = 'testpassword';
      const hashedPassword = await service.hashPassword(password);

      // Act
      const isValid = await service.verifyPassword(
        'wrongpassword',
        hashedPassword
      );

      // Assert
      expect(isValid).toBe(false);
    });
  });
});
