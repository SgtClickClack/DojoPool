import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with username/email and password, returns JWT tokens',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['usernameOrEmail', 'password'],
      properties: {
        usernameOrEmail: {
          type: 'string',
          description: 'Username or email address',
          example: 'john_doe',
        },
        password: {
          type: 'string',
          description: 'User password',
          example: 'securePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login successful' },
        access_token: { type: 'string', description: 'JWT access token' },
        refresh_token: { type: 'string', description: 'JWT refresh token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: { usernameOrEmail: string; password: string }) {
    try {
      const result = await this.authService.login(loginDto);
      return { message: 'Login successful', ...result };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('register')
  @ApiOperation({
    summary: 'User registration',
    description: 'Create a new user account with email, username, and password',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'username', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'User email address',
          example: 'john.doe@example.com',
        },
        username: {
          type: 'string',
          description: 'Unique username',
          example: 'john_doe',
          minLength: 3,
          maxLength: 50,
        },
        password: {
          type: 'string',
          description: 'User password (min 8 characters)',
          example: 'securePassword123!',
          minLength: 8,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Registration successful' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async register(
    @Body() registerDto: { email: string; username: string; password: string }
  ) {
    try {
      const result = await this.authService.register(registerDto);
      return { message: 'Registration successful', user: result };
    } catch (error) {
      throw new UnauthorizedException('Registration failed');
    }
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access token using refresh token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refresh_token'],
      properties: {
        refresh_token: {
          type: 'string',
          description: 'Valid refresh token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'New JWT access token' },
        refresh_token: { type: 'string', description: 'New JWT refresh token' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body || ({} as any);
    if (!refresh_token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return this.authService.refreshToken(refresh_token);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'User logout',
    description: 'Revoke refresh token to log out user from all devices',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refresh_token'],
      properties: {
        refresh_token: {
          type: 'string',
          description: 'Refresh token to revoke',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Token revoked successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async logout(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body || ({} as any);
    if (!refresh_token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return this.authService.revokeRefreshToken(refresh_token);
  }

  @Get('google')
  @ApiOperation({
    summary: 'Google OAuth login',
    description: 'Initiate Google OAuth authentication flow',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth consent screen',
  })
  async googleAuth(@Res() res: Response) {
    const authUrl = await this.authService.getGoogleAuthUrl();
    res.redirect(authUrl);
  }

  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handle Google OAuth callback and authenticate user',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with authentication token or error',
  })
  async googleAuthCallback(
    @Query('code') code: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const result = await this.authService.handleGoogleCallback(code);
      // Redirect to frontend with token
      const originHeader = (req.headers['origin'] as string) || '';
      const frontendUrl =
        process.env.FRONTEND_URL || originHeader || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    } catch (error) {
      const originHeader = (req.headers['origin'] as string) || '';
      const frontendUrl =
        process.env.FRONTEND_URL || originHeader || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }
}
