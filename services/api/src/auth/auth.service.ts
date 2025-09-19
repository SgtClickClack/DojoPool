import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';

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
    private readonly cacheService: CacheService
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

  async refreshToken(
    refreshToken: string,
    deviceId?: string,
    deviceInfo?: string
  ) {
    try {
      // Hash the token for lookup
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      // Check if token exists in database and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (
        !storedToken ||
        storedToken.isRevoked ||
        storedToken.expiresAt < new Date()
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Check Redis blocklist as additional security layer
      const blocked = await this.cacheService.exists(
        tokenHash,
        'auth:blocklist:'
      );
      if (blocked) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Verify device binding if provided
      if (
        deviceId &&
        storedToken.deviceId &&
        storedToken.deviceId !== deviceId
      ) {
        throw new UnauthorizedException(
          'Device mismatch - token bound to different device'
        );
      }

      const user = storedToken.user;
      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };

      // Revoke the old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      // Add old token to Redis blocklist
      await this.cacheService.set(tokenHash, true, {
        ttl: 7 * 24 * 3600, // 7 days
        keyPrefix: 'auth:blocklist:',
      });

      // Issue new tokens with rotation
      return this.issueTokens(payload, deviceId, deviceInfo);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(
    payload: {
      sub: string;
      username: string;
      role: string;
    },
    deviceId?: string,
    deviceInfo?: string
  ) {
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Hash the refresh token for storage
    const tokenHash = crypto
      .createHash('sha256')
      .update(refresh_token)
      .digest('hex');

    // Calculate expiration date
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const expiresAt = new Date();
    if (expiresIn.endsWith('d')) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn.slice(0, -1)));
    } else if (expiresIn.endsWith('h')) {
      expiresAt.setHours(
        expiresAt.getHours() + parseInt(expiresIn.slice(0, -1))
      );
    } else if (expiresIn.endsWith('m')) {
      expiresAt.setMinutes(
        expiresAt.getMinutes() + parseInt(expiresIn.slice(0, -1))
      );
    }

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash,
        deviceId,
        deviceInfo,
        expiresAt,
      },
    });

    return { access_token, refresh_token };
  }

  async revokeRefreshToken(refreshToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    try {
      // Update database record
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });

      // Derive TTL from token exp if possible; fallback to configured refresh TTL
      const decoded: any = this.jwtService.decode(refreshToken);
      const nowSec = Math.floor(Date.now() / 1000);
      let ttlSec = 0;
      if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
        ttlSec = Math.max(0, (decoded as any).exp - nowSec);
      } else {
        // Parse configured string like '7d', '1h'
        const cfg = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
        const m = cfg.match(/^(\d+)([smhd])$/);
        if (m) {
          const n = parseInt(m[1], 10);
          const unit = m[2];
          const mult =
            unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
          ttlSec = n * mult;
        } else {
          ttlSec = 7 * 24 * 3600;
        }
      }

      // Add to Redis blocklist
      await this.cacheService.set(tokenHash, true, {
        ttl: ttlSec,
        keyPrefix: 'auth:blocklist:',
      });
      return { message: 'Logged out' };
    } catch {
      // If decode fails, still attempt to hash and store with default TTL
      await this.cacheService.set(tokenHash, true, {
        ttl: 7 * 24 * 3600,
        keyPrefix: 'auth:blocklist:',
      });
      return { message: 'Logged out' };
    }
  }

  async cleanupExpiredTokens() {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
        },
      });
      console.log(`Cleaned up ${result.count} expired/revoked refresh tokens`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  async revokeAllUserTokens(userId: string) {
    try {
      // Revoke all tokens in database
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });

      // Get all token hashes for this user to add to Redis blocklist
      const tokens = await this.prisma.refreshToken.findMany({
        where: { userId },
        select: { tokenHash: true },
      });

      // Add all tokens to Redis blocklist
      const promises = tokens.map((token) =>
        this.cacheService.set(token.tokenHash, true, {
          ttl: 7 * 24 * 3600, // 7 days
          keyPrefix: 'auth:blocklist:',
        })
      );

      await Promise.all(promises);
      return { message: 'All tokens revoked' };
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      throw new UnauthorizedException('Failed to revoke tokens');
    }
  }
}
