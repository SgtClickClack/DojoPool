import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';

@Controller('v1/tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  create(@Body() createTournamentDto: any) {
    return this.tournamentsService.createTournament(createTournamentDto);
  }

  @Get()
  findAll() {
    return this.tournamentsService.findAllTournaments();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOneTournament(id);
  }

  @Get(':id/matches')
  findMatches(@Param('id') id: string) {
    return this.tournamentsService.findTournamentMatches(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTournamentDto: any) {
    return this.tournamentsService.updateTournament(id, updateTournamentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tournamentsService.removeTournament(id);
  }

  @Post(':id/register')
  register(@Param('id') id: string, @Body() registerDto: any) {
    return this.tournamentsService.registerPlayer(id, registerDto);
  }

  @Post(':id/unregister')
  unregister(@Param('id') id: string, @Body() unregisterDto: any) {
    return this.tournamentsService.unregisterPlayer(id, unregisterDto);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.tournamentsService.startTournament(id);
  }

  @Patch('matches/:matchId')
  updateMatch(@Param('matchId') matchId: string, @Body() updateMatchDto: any) {
    return this.tournamentsService.updateMatch(matchId, updateMatchDto);
  }

  @Get('matches/:matchId')
  getMatch(@Param('matchId') matchId: string) {
    return this.tournamentsService.getMatchById(matchId);
  }
}
