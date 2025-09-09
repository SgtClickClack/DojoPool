import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface WebSocketUser {
  id: string;
  username: string;
  email: string;
  role: string;
  tokenFamilyId?: string;
}

@Injectable()
export class AuthService {
  private readonly googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  private readonly googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  private readonly googleRedirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    'http://localhost:3002/api/v1/auth/google/callback';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
    private readonly redisService: RedisService
  ) {
    // Validate required environment variables
    if (!this.googleClientId) {
      console.warn(
        '⚠️ GOOGLE_OAUTH_CLIENT_ID is not set. Google OAuth will not work.'
      );
    }
    if (!this.googleClientSecret) {
      console.warn(
        '⚠️ GOOGLE_OAUTH_CLIENT_SECRET is not set. Google OAuth will not work.'
      );
    }
  }

  async register(data: RegisterDto) {
    const { email, username, password } = data;
    if (!email || !username || !password) {
      throw new BadRequestException(
        'email, username, and password are required'
      );
    }
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username }] },
    });
    if (existing) {
      throw new BadRequestException('Email or username already in use');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        passwordHash,
      },
    });
    const tokens = await this.issueTokens({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    return { user, ...tokens };
  }

  async login(data: LoginDto) {
    const { usernameOrEmail, password } = data;
    if (!usernameOrEmail || !password) {
      throw new BadRequestException(
        'usernameOrEmail and password are required'
      );
    }
    const identifier = usernameOrEmail.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: usernameOrEmail }],
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    return {
      user: { id: user.id, email: user.email, username: user.username },
      ...tokens,
    };
  }

  async getGoogleAuthUrl(): Promise<string> {
    if (!this.googleClientId) {
      // Temporary mock implementation for development/testing
      console.warn(
        'Google OAuth client ID not configured - using mock implementation'
      );
      const mockCode = 'mock_google_oauth_code_' + Date.now();
      return `${this.googleRedirectUri}?code=${mockCode}&state=mock_state`;
    }

    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: this.googleRedirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string) {
    if (!this.googleClientId || !this.googleClientSecret) {
      // Temporary mock implementation for development/testing
      console.warn(
        'Google OAuth not properly configured - using mock implementation'
      );

      // Mock user data for testing
      const mockEmail = 'test.user@example.com';
      const mockName = 'Test User';
      const mockPicture = 'https://via.placeholder.com/150';

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email: mockEmail.toLowerCase() },
      });

      if (!user) {
        // Create new user with mock Google info
        user = await this.prisma.user.create({
          data: {
            email: mockEmail.toLowerCase(),
            username: mockName || mockEmail.split('@')[0],
            passwordHash: '', // Google users don't need password
            profile: {
              create: {
                displayName: mockName,
                avatarUrl: mockPicture,
              },
            },
          },
        });
      }

      // Generate JWT token
      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };
      const tokens = await this.issueTokens(payload);
      return tokens;
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: this.googleClientId,
          client_secret: this.googleClientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.googleRedirectUri,
        }
      );

      const { access_token } = tokenResponse.data;

      // Get user info from Google
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const { email, name, picture } = userInfoResponse.data;

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Create new user with Google info
        user = await this.prisma.user.create({
          data: {
            email: email.toLowerCase(),
            username: name || email.split('@')[0],
            passwordHash: '', // Google users don't need password
            profile: {
              create: {
                displayName: name,
                avatarUrl: picture,
              },
            },
          },
        });
      }

      // Generate JWT token
      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };
      const tokens = await this.issueTokens(payload);
      return tokens;
    } catch (error) {
      console.error('Google OAuth error:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Generate token hash for Redis storage
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      // Check if token is in blocklist (one-time use)
      const blocklistKey = `auth:blocklist:${tokenHash}`;
      const isBlocked = await this.redisService.get(blocklistKey);
      if (isBlocked) {
        throw new UnauthorizedException(
          'Refresh token has been used and is no longer valid'
        );
      }

      // Verify the JWT token
      const decoded: any = await this.jwtService.verifyAsync(refreshToken);

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new token family ID for rotation
      const tokenFamilyId = crypto.randomUUID();
      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
        tokenFamilyId, // Include family ID in payload for tracking
      };

      // Issue new tokens
      const tokens = await this.issueTokens(payload);

      // Block the old refresh token (one-time use)
      const oldTokenExpiry = decoded.exp
        ? decoded.exp - Math.floor(Date.now() / 1000)
        : 7 * 24 * 3600;
      await this.redisService.set(
        blocklistKey,
        'used',
        Math.max(1, oldTokenExpiry)
      );

      // Store new refresh token metadata in Redis
      const newTokenHash = crypto
        .createHash('sha256')
        .update(tokens.refresh_token)
        .digest('hex');

      const metadataKey = `auth:token:${newTokenHash}`;
      const metadata = JSON.stringify({
        userId: user.id,
        tokenFamilyId,
        createdAt: new Date().toISOString(),
        userAgent: '', // Could be passed from request headers
        ipAddress: '', // Could be passed from request
      });

      // Store with TTL matching refresh token expiry
      const refreshExpiry = this.parseTokenExpiry(
        process.env.JWT_REFRESH_EXPIRES_IN || '7d'
      );
      await this.redisService.set(metadataKey, metadata, refreshExpiry);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(payload: {
    sub: string;
    username: string;
    role: string;
  }) {
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { access_token, refresh_token };
  }

  async revokeRefreshToken(refreshToken: string) {
    try {
      // Hash the token for Redis storage
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      // Add to blocklist (one-time use)
      const blocklistKey = `auth:blocklist:${tokenHash}`;

      // Try to get token expiry from JWT or use default
      let ttlSec = 7 * 24 * 3600; // Default 7 days
      try {
        const decoded: any = this.jwtService.decode(refreshToken);
        if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
          const nowSec = Math.floor(Date.now() / 1000);
          ttlSec = Math.max(1, (decoded as any).exp - nowSec);
        }
      } catch {
        // Use default TTL if decode fails
        ttlSec = this.parseTokenExpiry(
          process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        );
      }

      await this.redisService.set(blocklistKey, 'revoked', ttlSec);

      // If token has family ID, revoke entire family (optional - for enhanced security)
      try {
        const decoded: any = this.jwtService.decode(refreshToken);
        if (decoded?.tokenFamilyId) {
          await this.revokeTokenFamily(decoded.tokenFamilyId, decoded.sub);
        }
      } catch {
        // Ignore if family revocation fails
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      // If Redis fails, still try to block using cache service as fallback
      try {
        const hashed = crypto
          .createHash('sha256')
          .update(refreshToken)
          .digest('hex');
        await this.cacheService.set(hashed, true, {
          ttl: 7 * 24 * 3600,
          keyPrefix: 'auth:blocklist:',
        });
      } catch (cacheError) {
        console.error(
          'Failed to revoke token in both Redis and cache:',
          cacheError
        );
      }
      throw new UnauthorizedException('Failed to revoke refresh token');
    }
  }

  private async revokeTokenFamily(tokenFamilyId: string, userId: string) {
    try {
      // Find all tokens in the same family
      const familyPattern = `auth:token:*`;
      const allTokenKeys = await this.redisService.keys(familyPattern);

      for (const key of allTokenKeys) {
        const metadata = await this.redisService.get(key);
        if (metadata) {
          try {
            const parsed = JSON.parse(metadata);
            if (
              parsed.tokenFamilyId === tokenFamilyId &&
              parsed.userId === userId
            ) {
              // Block this token
              const tokenHash = key.replace('auth:token:', '');
              const blocklistKey = `auth:blocklist:${tokenHash}`;
              await this.redisService.set(
                blocklistKey,
                'family_revoked',
                7 * 24 * 3600
              );
            }
          } catch {
            // Skip invalid metadata
          }
        }
      }
    } catch (error) {
      console.warn('Failed to revoke token family:', error);
    }
  }

  private parseTokenExpiry(expiryString: string): number {
    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 7 * 24 * 3600; // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit as keyof typeof multipliers] || 86400);
  }

  async validateWebSocketToken(token: string) {
    try {
      // Check if token is in blocklist
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const blocklistKey = `auth:blocklist:${tokenHash}`;
      const isBlocked = await this.redisService.get(blocklistKey);
      if (isBlocked) {
        throw new Error('Token has been revoked');
      }

      // Verify the JWT token
      const decoded: any = await this.jwtService.verifyAsync(token);

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tokenFamilyId: decoded.tokenFamilyId,
      };
    } catch (error) {
      throw new Error('Invalid WebSocket authentication token');
    }
  }
}
