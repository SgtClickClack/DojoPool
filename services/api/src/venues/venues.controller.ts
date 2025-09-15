import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Cacheable } from '../cache/cache.decorator';
import { VenueOwnerGuard } from './venue-owner.guard';
import { VenuesService } from './venues.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { StartTournamentDto } from './dto/start-tournament.dto';

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

  // Public: list all venues with filters
  @Get()
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'venues:list',
  })
  async listVenues(@Request() req: any) {
    const {
      search,
      city,
      state,
      hasTournaments,
      hasFood,
      hasBar,
      page = 1,
      limit = 12,
    } = req.query;

    const filters = {
      search: search as string,
      city: city as string,
      state: state as string,
      hasTournaments: hasTournaments === 'true',
      hasFood: hasFood === 'true',
      hasBar: hasBar === 'true',
    };

    return this.service.listVenues(filters, { page: +page, limit: +limit });
  }

  // Public: get venue by ID
  @Get(':id')
  @Cacheable({
    ttl: 600, // 10 minutes
    keyPrefix: 'venues:detail',
  })
  async getVenue(@Param('id') id: string) {
    return this.service.getVenue(id);
  }

  // Public: list active quests for a venue
  @Get(':venueId/quests')
  async listVenueQuests(@Param('venueId') venueId: string) {
    return this.service.listActiveQuests(venueId);
  }

  // Tournament Management for Venue Owners

  // List all tournaments for the authenticated venue owner
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Get('me/tournaments')
  async listMyTournaments(@Request() req: any) {
    return this.service.listMyTournaments(req.user.sub);
  }

  // Create a new tournament for the authenticated venue owner
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Post('me/tournaments')
  async createMyTournament(
    @Request() req: any,
    @Body() createTournamentDto: CreateTournamentDto
  ) {
    return this.service.createMyTournament(req.user.sub, createTournamentDto);
  }

  // Get a specific tournament for the authenticated venue owner
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Get('me/tournaments/:tournamentId')
  async getMyTournament(
    @Request() req: any,
    @Param('tournamentId') tournamentId: string
  ) {
    return this.service.getMyTournament(req.user.sub, tournamentId);
  }

  // Update a tournament for the authenticated venue owner
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Patch('me/tournaments/:tournamentId')
  async updateMyTournament(
    @Request() req: any,
    @Param('tournamentId') tournamentId: string,
    @Body() updateTournamentDto: UpdateTournamentDto
  ) {
    return this.service.updateMyTournament(req.user.sub, tournamentId, updateTournamentDto);
  }

  // Start a tournament for the authenticated venue owner
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Post('me/tournaments/:tournamentId/start')
  async startMyTournament(
    @Request() req: any,
    @Param('tournamentId') tournamentId: string,
    @Body() startTournamentDto: StartTournamentDto
  ) {
    return this.service.startMyTournament(req.user.sub, tournamentId, startTournamentDto);
  }

  // Delete a tournament for the authenticated venue owner
  @UseGuards(JwtAuthGuard, VenueOwnerGuard)
  @Delete('me/tournaments/:tournamentId')
  async deleteMyTournament(
    @Request() req: any,
    @Param('tournamentId') tournamentId: string
  ) {
    return this.service.deleteMyTournament(req.user.sub, tournamentId);
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
