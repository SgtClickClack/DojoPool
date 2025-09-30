import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Cacheable } from '../cache/cache.decorator';
import { ClansService } from './clans.service';
import { CreateClanDto } from './dto/create-clan.dto';
import { UpgradeDojoDto } from './dto/upgrade-dojo.dto';
import { AuthenticatedRequest } from '../common/interfaces/request.interfaces';
import { ClanResponseDto, ClanMemberResponseDto } from '../common/dto/clan.dto';

@Controller('clans')
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createClan(
    @Body() createClanDto: CreateClanDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ClanResponseDto> {
    return this.clansService.createClan({
      name: createClanDto.name,
      description: createClanDto.description,
      leaderId: req.user.sub,
    });
  }

  @Get()
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'clans:list',
  })
  async getAllClans(): Promise<ClanResponseDto[]> {
    return this.clansService.getAllClans();
  }

  @Get(':clanId')
  @Cacheable({
    ttl: 600, // 10 minutes
    keyPrefix: 'clans:detail',
  })
  async getClanById(@Param('clanId') clanId: string): Promise<ClanResponseDto> {
    return this.clansService.getClanById(clanId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':clanId/join')
  async joinClan(
    @Param('clanId') clanId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<ClanMemberResponseDto> {
    return this.clansService.joinClan(clanId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':clanId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveClan(
    @Param('clanId') clanId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    return this.clansService.leaveClan(clanId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/dojos/:venueId/upgrade')
  async upgradeDojo(
    @Param('venueId') venueId: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: UpgradeDojoDto
  ) {
    return this.clansService.upgradeDojo(venueId, req.user.sub, body);
  }
}
