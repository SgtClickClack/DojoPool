import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Cacheable } from '../cache/cache.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { GetJournalQueryDto } from './dto/get-journal-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JournalService } from './journal.service';
import { UserProfileService } from './user-profile.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly journalService: JournalService,
    private readonly userProfileService: UserProfileService
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'users:list',
  })
  findAll() {
    return this.usersService.findAllUsers();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(
    @Req() req: ExpressRequest & { user: { userId: string } }
  ) {
    const userId = req.user.userId;
    return this.usersService.findUserById(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req: ExpressRequest & { user: { userId: string } },
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateProfileDto: UpdateProfileDto
  ) {
    const userId = req.user.userId;
    return this.userProfileService.updateProfile(userId, updateProfileDto);
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
    return this.userProfileService.uploadAvatar(userId, file);
  }

  @Get('me/journal')
  @UseGuards(JwtAuthGuard)
  async getMyJournal(
    @Req()
    req: ExpressRequest & {
      user: { userId?: string; sub?: string; id?: string };
    },
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetJournalQueryDto
  ) {
    const userId = (req.user.userId || req.user.sub || req.user.id) as string;
    return this.journalService.getJournal(userId, query.page, query.limit);
  }

  @Get(':userId/challenges')
  @UseGuards(JwtAuthGuard)
  async getUserChallenges(@Param('userId') userId: string) {
    return this.usersService.getUserChallenges(userId);
  }

  @Get(':userId/nfts')
  @UseGuards(JwtAuthGuard)
  async getUserNFTs(@Param('userId') userId: string) {
    return this.usersService.getUserNFTs(userId);
  }
}
