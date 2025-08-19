import { Controller, Get, Param, Post } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('v1/matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.getMatchById(id);
  }

  // Minimal resume endpoint to support frontend useGameState resume call
  @Post(':id/resume')
  async resume(@Param('id') id: string) {
    // In a full implementation, you would update match status in DB and broadcast via gateway
    return { matchId: id, status: 'resumed', ok: true };
  }
}
