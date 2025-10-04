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
import { ClanRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Cacheable } from '../cache/cache.decorator';
import {
  ClanMemberResponseDto,
  ClanMemberRole,
  ClanResponseDto,
  ClanStatus,
} from '../common/dto/clan.dto';
import { AuthenticatedRequest } from '../common/interfaces/request.interfaces';
import { ClansService } from './clans.service';
import { CreateClanDto } from './dto/create-clan.dto';
import { UpgradeDojoDto } from './dto/upgrade-dojo.dto';

@Controller('clans')
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  private convertClanRole(role: ClanRole): ClanMemberRole {
    switch (role) {
      case ClanRole.LEADER:
        return ClanMemberRole.LEADER;
      case ClanRole.OFFICER:
        return ClanMemberRole.OFFICER;
      case ClanRole.MEMBER:
        return ClanMemberRole.MEMBER;
      case ClanRole.COLEADER:
        return ClanMemberRole.OFFICER; // Map COLEADER to OFFICER
      default:
        return ClanMemberRole.MEMBER;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createClan(
    @Body() createClanDto: CreateClanDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ClanResponseDto> {
    const clan = await this.clansService.createClan({
      name: createClanDto.name,
      description: createClanDto.description,
      leaderId: req.user.sub,
    });
    return {
      ...clan,
      status: ClanStatus.ACTIVE,
      isPublic: true,
      memberCount: 1,
      createdAt: clan.createdAt.toISOString(),
      updatedAt: clan.updatedAt.toISOString(),
    };
  }

  @Get()
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'clans:list',
  })
  async getAllClans(): Promise<ClanResponseDto[]> {
    const clans = await this.clansService.getAllClans();
    return clans.map((clan) => ({
      ...clan,
      status: ClanStatus.ACTIVE,
      isPublic: true,
      memberCount: clan._count?.members || 0,
      createdAt: clan.createdAt.toISOString(),
      updatedAt: clan.updatedAt.toISOString(),
    }));
  }

  @Get(':clanId/territories')
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'clans:territories',
  })
  async getClanTerritories(@Param('clanId') clanId: string) {
    return this.clansService.getClanTerritories(clanId);
  }

  @Get(':clanId')
  @Cacheable({
    ttl: 600, // 10 minutes
    keyPrefix: 'clans:detail',
  })
  async getClanById(@Param('clanId') clanId: string): Promise<ClanResponseDto> {
    const clan = await this.clansService.getClanById(clanId);
    return {
      ...clan,
      status: ClanStatus.ACTIVE,
      isPublic: true,
      memberCount: clan.members?.length || 0,
      createdAt: clan.createdAt.toISOString(),
      updatedAt: clan.updatedAt.toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':clanId/join')
  async joinClan(
    @Param('clanId') clanId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<ClanMemberResponseDto> {
    const member = await this.clansService.joinClan(clanId, req.user.sub);
    return {
      ...member,
      role: this.convertClanRole(member.role),
      lastActivityAt: new Date().toISOString(),
      isActive: true,
      joinedAt: member.joinedAt.toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':clanId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveClan(
    @Param('clanId') clanId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    await this.clansService.leaveClan(clanId, req.user.sub);
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
