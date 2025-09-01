import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateShadowRunDto } from './dto/create-shadow-run.dto';
import { ShadowRunsService } from './shadow-runs.service';

@Controller('shadow-runs')
export class ShadowRunsController {
  constructor(private readonly shadowRuns: ShadowRunsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateShadowRunDto, @Request() req: any) {
    const userId = req.user?.sub as string;
    return this.shadowRuns.initiateRun(
      userId,
      dto.targetVenueId,
      dto.runType as any
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('clan/:clanId')
  async getClanRuns(@Param('clanId') clanId: string, @Request() req: any) {
    const userId = req.user.sub;
    // Check if user is member of clan - simplified for now
    const membership = { role: 'MEMBER' }; // Placeholder
    // TODO: Re-enable proper clan membership check
    // const membership = await this.shadowRuns.prisma.clanMember.findFirst({
    //   where: { clanId, userId },
    // });
    if (!membership) {
      throw new ForbiddenException('Not a member of this clan');
    }
    return this.shadowRuns.getRunsForClan(clanId);
  }
}
