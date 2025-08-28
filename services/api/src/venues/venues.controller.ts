import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VenuesService } from './venues.service';
import { VenueOwnerGuard } from './venue-owner.guard';

@Controller('venues')
export class VenuesController {
  constructor(private service: VenuesService) {}

  // Profile management
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Get('me')
  async getMyVenue(@Request() req: any) {
    return this.service.getMyVenue(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Patch('me')
  async updateMyVenue(@Request() req: any, @Body() data: any) {
    return this.service.updateMyVenue(req.user.sub, data);
  }

  // Specials management
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Get('me/specials')
  async listMySpecials(@Request() req: any) {
    return this.service.listMySpecials(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Post('me/specials')
  async createMySpecial(@Request() req: any, @Body() data: any) {
    return this.service.createMySpecial(req.user.sub, data);
  }

  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Delete('me/specials/:specialId')
  async deleteMySpecial(
    @Request() req: any,
    @Param('specialId') specialId: string
  ) {
    return this.service.deleteMySpecial(req.user.sub, specialId);
  }

  // Sponsorship
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Post('me/tournaments/:tournamentId/sponsor')
  async sponsorTournament(
    @Request() req: any,
    @Param('tournamentId') tournamentId: string,
    @Body() data: any
  ) {
    return this.service.sponsorTournament(
      req.user.sub,
      tournamentId,
      data?.sponsorBannerUrl
    );
  }

  // Quests
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Post('me/quests')
  async createMyQuest(@Request() req: any, @Body() data: any) {
    return this.service.createMyQuest(req.user.sub, data);
  }

  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Delete('me/quests/:questId')
  async deleteMyQuest(@Request() req: any, @Param('questId') questId: string) {
    return this.service.deleteMyQuest(req.user.sub, questId);
  }

  // Public: list active quests for a venue
  @Get(':venueId/quests')
  async listVenueQuests(@Param('venueId') venueId: string) {
    return this.service.listActiveQuests(venueId);
  }

  // Legacy/other endpoints
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: any
  ) {
    return this.service.updateVenue(id, req.user.sub, data);
  }
}
