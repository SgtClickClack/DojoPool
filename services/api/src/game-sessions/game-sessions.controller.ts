import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type {
  CreateGameSessionDto,
  GameSessionUpdateDto,
  ShotData,
} from './game-sessions.service';
import { GameSessionsService } from './game-sessions.service';

@Controller('game-sessions')
@UseGuards(JwtAuthGuard)
export class GameSessionsController {
  private readonly logger = new Logger(GameSessionsController.name);

  constructor(private readonly gameSessionsService: GameSessionsService) {}

  @Post()
  async createGameSession(@Body() createDto: CreateGameSessionDto) {
    this.logger.log(`Creating game session for game ${createDto.gameId}`);
    return this.gameSessionsService.createGameSession(createDto);
  }

  @Get(':id')
  async getGameSession(@Param('id') id: string) {
    this.logger.log(`Getting game session ${id}`);
    return this.gameSessionsService.getGameSession(id);
  }

  @Get('game/:gameId/active')
  async getActiveGameSession(@Param('gameId') gameId: string) {
    this.logger.log(`Getting active game session for game ${gameId}`);
    return this.gameSessionsService.getActiveGameSession(gameId);
  }

  @Put(':id')
  async updateGameSession(
    @Param('id') id: string,
    @Body() updateDto: GameSessionUpdateDto
  ) {
    this.logger.log(`Updating game session ${id}`);
    return this.gameSessionsService.updateGameSession(id, updateDto);
  }

  @Post(':id/shot')
  async recordShot(@Param('id') id: string, @Body() shotData: ShotData) {
    this.logger.log(`Recording shot in game session ${id}`);
    return this.gameSessionsService.recordShot(id, shotData);
  }

  @Post(':id/foul')
  async recordFoul(
    @Param('id') id: string,
    @Body() foulData: { playerId: string; foulType: string; reason: string }
  ) {
    this.logger.log(`Recording foul in game session ${id}`);
    return this.gameSessionsService.recordFoul(
      id,
      foulData.playerId,
      foulData.foulType,
      foulData.reason
    );
  }

  @Post(':id/end')
  async endGameSession(
    @Param('id') id: string,
    @Body() endData: { winnerId: string }
  ) {
    this.logger.log(
      `Ending game session ${id} with winner ${endData.winnerId}`
    );
    return this.gameSessionsService.endGameSession(id, endData.winnerId);
  }

  @Get(':id/analytics')
  async getGameSessionAnalytics(@Param('id') id: string) {
    this.logger.log(`Getting analytics for game session ${id}`);
    return this.gameSessionsService.getGameSessionAnalytics(id);
  }
}
