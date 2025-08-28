import { Controller, Get, Param, Query } from '@nestjs/common';
import { SeasonsService } from './seasons.service';

@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get('active')
  async getActiveSeason() {
    const season = await this.seasonsService.getActiveSeason();
    if (!season) {
      // Returning null with 200 might be more convenient for frontend, but
      // their API client handles error case as "no active season" by catch.
      // Throwing 404 would cause axios to go to catch.
      // To be less disruptive, return null directly.
      return null;
    }
    return season;
  }

  @Get('leaderboard')
  async getSeasonalLeaderboard(@Query('limit') limit?: string) {
    const n = Number.parseInt(limit ?? '10', 10);
    const safeLimit = Number.isFinite(n) && n > 0 ? n : 10;
    return this.seasonsService.getSeasonalLeaderboard(safeLimit);
  }

  @Get()
  async getAllSeasons() {
    return this.seasonsService.getAllSeasons();
  }

  @Get(':id')
  async getSeasonById(@Param('id') id: string) {
    return this.seasonsService.getSeasonById(id);
  }
}
