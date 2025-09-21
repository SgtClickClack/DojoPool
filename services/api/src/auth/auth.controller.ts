import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { usernameOrEmail: string; password: string }) {
    try {
      const result = await this._authService.login(loginDto);
      return { message: 'Login successful', ...result };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('register')
  async register(
    @Body() registerDto: { email: string; username: string; password: string }
  ) {
    try {
      const result = await this._authService.register(registerDto);
      return { message: 'Registration successful', user: result };
    } catch (error) {
      throw new UnauthorizedException('Registration failed');
    }
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string; device_id?: string; device_info?: string }) {
    const { refresh_token, device_id, device_info } = body || ({} as any);
    if (!refresh_token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return this._authService.refreshToken(refresh_token, device_id, device_info);
  }

  @Post('logout')
  async logout(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body || ({} as any);
    if (!refresh_token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return this._authService.revokeRefreshToken(refresh_token);
  }

  @Get('google')
  async googleAuth(@Res() res: Response) {
    const authUrl = await this._authService.getGoogleAuthUrl();
    res.redirect(authUrl);
  }

  @Get('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this._authService.handleGoogleCallback(code);
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }
}
