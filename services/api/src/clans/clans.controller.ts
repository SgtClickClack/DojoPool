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
import { ClansService } from './clans.service';
import { ClanResponseDto } from './dto/clan-response.dto';
import { CreateClanDto } from './dto/create-clan.dto';
import { UpgradeDojoDto } from './dto/upgrade-dojo.dto';

@Controller('clans')
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createClan(
    @Body() createClanDto: CreateClanDto,
    @Request() req: any
  ): Promise<any> {
    return this.clansService.createClan({
      name: createClanDto.name,
      description: createClanDto.description,
      leaderId: req.user.sub,
    });
  }

  @Get()
  async getAllClans(): Promise<any[]> {
    return this.clansService.getAllClans();
  }

  @Get(':clanId')
  async getClanById(@Param('clanId') clanId: string): Promise<any> {
    return this.clansService.getClanById(clanId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':clanId/join')
  async joinClan(
    @Param('clanId') clanId: string,
    @Request() req: any
  ): Promise<any> {
    return this.clansService.joinClan(clanId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':clanId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveClan(
    @Param('clanId') clanId: string,
    @Request() req: any
  ): Promise<any> {
    return this.clansService.leaveClan(clanId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/dojos/:venueId/upgrade')
  async upgradeDojo(
    @Param('venueId') venueId: string,
    @Request() req: any,
    @Body() body: UpgradeDojoDto
  ) {
    return this.clansService.upgradeDojo(venueId, req.user.sub, body);
  }
}
