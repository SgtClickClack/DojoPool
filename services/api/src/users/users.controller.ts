import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  HttpCode,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetJournalQueryDto } from './dto/get-journal-query.dto';
import { UsersService } from './users.service';
import { JournalService } from './journal.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly journalService: JournalService
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAllUsers();
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req: ExpressRequest & { user: { userId: string } },
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateProfileDto: UpdateProfileDto
  ) {
    const userId = req.user.userId;
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Req() req: ExpressRequest & { user: { userId: string } },
    @UploadedFile() file: any
  ) {
    const userId = req.user.userId;
    return this.usersService.uploadAvatar(userId, file);
  }

  @Get('me/journal')
  @UseGuards(JwtAuthGuard)
  async getMyJournal(
    @Req() req: ExpressRequest & { user: { userId?: string; sub?: string; id?: string } },
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetJournalQueryDto
  ) {
    const userId = (req.user.userId || req.user.sub || req.user.id) as string;
    return this.journalService.getJournal(userId, query.page, query.limit);
  }
}
