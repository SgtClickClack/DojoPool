import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { usernameOrEmail: string; password: string }) {
    try {
      const result = await this.authService.login(loginDto);
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
      const result = await this.authService.register(registerDto);
      return { message: 'Registration successful', user: result };
    } catch (error) {
      throw new UnauthorizedException('Registration failed');
    }
  }
}
