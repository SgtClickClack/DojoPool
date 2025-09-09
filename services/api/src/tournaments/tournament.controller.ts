import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { JoinTournamentDto } from './dto/join-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { MatchmakingService } from './matchmaking.service';
import { TournamentService } from './tournament.service';

@Controller('tournaments')
@UseGuards(JwtAuthGuard)
export class TournamentController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly matchmakingService: MatchmakingService
  ) {}

  // Tournament Management Endpoints

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createTournament(
    @Body() createTournamentDto: CreateTournamentDto,
    @Request() req: any
  ) {
    return this.tournamentService.create(createTournamentDto, req.user.userId);
  }

  @Get()
  async findAllTournaments(
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('status') status?: string,
    @Query('venueId') venueId?: string
  ) {
    return this.tournamentService.findAll({
      status: status as any,
      venueId,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOneTournament(@Param('id') id: string) {
    return this.tournamentService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async updateTournament(
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
    @Request() req: any
  ) {
    return this.tournamentService.update(
      id,
      updateTournamentDto,
      req.user.userId
    );
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTournament(@Param('id') id: string, @Request() req: any) {
    return this.tournamentService.delete(id, req.user.userId);
  }

  // Tournament Participation Endpoints

  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  async joinTournament(
    @Param('id') tournamentId: string,
    @Body() joinTournamentDto: JoinTournamentDto,
    @Request() req: any
  ) {
    return this.tournamentService.joinTournament(
      tournamentId,
      joinTournamentDto,
      req.user.userId
    );
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leaveTournament(
    @Param('id') tournamentId: string,
    @Request() req: any
  ) {
    return this.tournamentService.leaveTournament(
      tournamentId,
      req.user.userId
    );
  }

  // Tournament Bracket Endpoints

  @Get(':id/bracket')
  async getTournamentBracket(@Param('id') tournamentId: string) {
    return this.tournamentService.getTournamentBracket(tournamentId);
  }

  @Post(':id/bracket/generate')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async generateBracket(
    @Param('id') tournamentId: string,
    @Request() req: any
  ) {
    return this.tournamentService.generateBracket(
      tournamentId,
      req.user.userId
    );
  }

  @Post(':id/start')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async startTournament(
    @Param('id') tournamentId: string,
    @Request() req: any
  ) {
    return this.tournamentService.startTournament(
      tournamentId,
      req.user.userId
    );
  }

  @Post(':id/advance')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async advanceTournamentRound(
    @Param('id') tournamentId: string,
    @Request() req: any
  ) {
    return this.tournamentService.advanceTournamentRound(
      tournamentId,
      req.user.userId
    );
  }

  // User Tournament History

  @Get('user/history')
  async getUserTournamentHistory(
    @Request() req: any,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number
  ) {
    return this.tournamentService.getUserTournamentHistory(
      req.user.userId,
      page,
      limit
    );
  }

  // Matchmaking Endpoints

  @Post('matchmaking/join')
  @HttpCode(HttpStatus.OK)
  async joinMatchmakingQueue(@Request() req: any) {
    return this.matchmakingService.joinQueue(req.user.userId);
  }

  @Post('matchmaking/leave')
  @HttpCode(HttpStatus.OK)
  async leaveMatchmakingQueue(@Request() req: any) {
    return this.matchmakingService.leaveQueue(req.user.userId);
  }

  @Get('matchmaking/status')
  async getMatchmakingStatus(@Request() req: any) {
    return this.matchmakingService.getQueueStatus(req.user.userId);
  }

  @Post('matches/:id/result')
  @HttpCode(HttpStatus.OK)
  async submitMatchResult(
    @Param('id') matchId: string,
    @Body() result: { winnerId: string; scoreA: number; scoreB: number },
    @Request() req: any
  ) {
    // Validate that the user is a participant in this match
    const match = await this.tournamentService['prisma'].match.findUnique({
      where: { id: matchId },
      select: { playerAId: true, playerBId: true },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (
      match.playerAId !== req.user.userId &&
      match.playerBId !== req.user.userId
    ) {
      throw new Error('User is not a participant in this match');
    }

    return this.matchmakingService.submitMatchResult(
      matchId,
      result.winnerId,
      result.scoreA,
      result.scoreB
    );
  }

  @Get('matchmaking/statistics')
  @UseGuards(AdminGuard)
  async getMatchmakingStatistics() {
    return this.matchmakingService.getStatistics();
  }

  // Admin Endpoints for Matchmaking Management

  @Post('matchmaking/process')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async processMatchmaking() {
    await this.matchmakingService.processMatchmaking();
    return { success: true };
  }
}
