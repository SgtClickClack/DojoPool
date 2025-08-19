import { Body, Controller, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    try {
      const user = await this.authService.register(body);
      return { id: user.id, email: user.email, username: user.username };
    } catch (e: any) {
      throw new HttpException(e.message || 'Registration failed', e.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    try {
      const result = await this.authService.login(body);
      return result; // { access_token }
    } catch (e: any) {
      throw new HttpException(e.message || 'Invalid credentials', e.status || HttpStatus.UNAUTHORIZED);
    }
  }
}
