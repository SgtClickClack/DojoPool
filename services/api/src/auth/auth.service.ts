import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  private readonly googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  private readonly googleRedirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    'http://localhost:3002/api/v1/auth/google/callback';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
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
    return { user: { id: user.id, email: user.email, username: user.username }, ...tokens };
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
      const decoded: any = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const payload = { sub: user.id, username: user.username, role: user.role };
      return this.issueTokens(payload);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(payload: { sub: string; username: string; role: string }) {
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { access_token, refresh_token };
  }
}
