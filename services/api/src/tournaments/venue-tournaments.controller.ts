import { Body, Controller, Get, Param, Post, ValidationPipe } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';

// This controller handles venue-scoped tournaments endpoints
// Path base: /api/v1/venues/:venueId/tournaments
@Controller('v1/venues/:venueId/tournaments')
export class VenueTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  // Create tournament for a venue
  @Post()
  create(
    @Param('venueId') venueId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createTournamentDto: CreateTournamentDto
  ) {
    return this.tournamentsService.create(createTournamentDto, venueId);
  }

  // List tournaments for a venue
  @Get()
  findByVenue(@Param('venueId') venueId: string) {
    return this.tournamentsService.findTournamentsByVenue(venueId);
  }
}
