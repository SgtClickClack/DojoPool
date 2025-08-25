import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { MatchesService } from './matches.service';

interface FinalizeMatchDto {
  winnerId: string;
  scoreA: number;
  scoreB: number;
}

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.getMatchById(id);
  }

  @Get(':id/analysis')
  async getMatchWithAnalysis(@Param('id') id: string) {
    return this.matchesService.getMatchWithAnalysis(id);
  }

  @Put(':id/finalize')
  async finalizeMatch(
    @Param('id') id: string,
    @Body() finalizeData: FinalizeMatchDto
  ) {
    return this.matchesService.finalizeMatch(
      id,
      finalizeData.winnerId,
      finalizeData.scoreA,
      finalizeData.scoreB
    );
  }

  // Minimal resume endpoint to support frontend useGameState resume call
  @Post(':id/resume')
  async resume(@Param('id') id: string) {
    // In a full implementation, you would update match status in DB and broadcast via gateway
    return { matchId: id, status: 'resumed', ok: true };
  }
}
