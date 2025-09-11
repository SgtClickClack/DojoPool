import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { TerritoryService } from './territory.service';

class ClaimTerritoryDto {
  playerId: string;
  territoryId: string;
  matchId: string;
}

@Controller('territories')
export class TerritoryController {
  constructor(private readonly territoryService: TerritoryService) {}

  @Post('claim')
  async claimTerritory(
    @Body() claimTerritoryDto: ClaimTerritoryDto
  ): Promise<{ message: string }> {
    try {
      const { playerId, territoryId, matchId } = claimTerritoryDto;
      await this.territoryService.claimTerritory(
        playerId,
        territoryId,
        matchId
      );
      return { message: 'Territory claimed successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':territoryId')
  async getTerritory(@Param('territoryId') territoryId: string): Promise<any> {
    // Note: Implementation for getting territory status is not in the service yet.
    // This is a placeholder.
    return { territoryId, status: 'Not implemented' };
  }
}
