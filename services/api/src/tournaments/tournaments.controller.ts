import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CacheInvalidate, Cacheable } from '../cache/cache.decorator';
import { TournamentsService } from './tournaments.service';

@Controller('v1/tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @CacheInvalidate(['tournaments:list:*'])
  create(@Body() createTournamentDto: any) {
    return this.tournamentsService.createTournament(createTournamentDto);
  }

  @Get()
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'tournaments:list:',
  })
  findAll() {
    return this.tournamentsService.findAllTournaments();
  }

  @Get(':id')
  @Cacheable({
    ttl: 600, // 10 minutes
    keyPrefix: 'tournaments:detail:',
  })
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOneTournament(id);
  }

  @Get(':id/matches')
  @Cacheable({
    ttl: 120, // 2 minutes
    keyPrefix: 'tournaments:matches:',
  })
  findMatches(@Param('id') id: string) {
    return this.tournamentsService.findTournamentMatches(id);
  }

  @Patch(':id')
  @CacheInvalidate(['tournaments:detail:*', 'tournaments:list:*'])
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
  @Cacheable({
    ttl: 60, // 1 minute
    keyPrefix: 'tournaments:match:',
  })
  getMatch(@Param('matchId') matchId: string) {
    return this.tournamentsService.getMatchById(matchId);
  }
}
