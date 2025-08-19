import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GameSession, GameSessionStatus, GameType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateGameSessionDto {
  gameId: string;
  venueId?: string;
  playerIds: string[];
  gameType: GameType;
  rules: Record<string, any>;
}

export interface GameSessionUpdateDto {
  status?: GameSessionStatus;
  currentPlayerId?: string;
  ballStates?: Record<string, string>;
  fouls?: Record<string, number>;
  score?: Record<string, number>;
  events?: any[];
}

export interface ShotData {
  playerId: string;
  ballId: string;
  velocity: number;
  direction: { x: number; y: number };
  timestamp: Date;
}

@Injectable()
export class GameSessionsService {
  private readonly logger = new Logger(GameSessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createGameSession(
    createDto: CreateGameSessionDto
  ): Promise<GameSession> {
    try {
      const gameSession = await this.prisma.gameSession.create({
        data: {
          gameId: createDto.gameId,
          venueId: createDto.venueId,
          status: GameSessionStatus.ACTIVE,
          gameType: createDto.gameType,
          rules: createDto.rules,
          startTime: new Date(),
          playerIds: createDto.playerIds,
          currentPlayerId: createDto.playerIds[0], // First player starts
          ballStates: this.initializeBallStates(),
          fouls: createDto.playerIds.reduce(
            (acc, id) => ({ ...acc, [id]: 0 }),
            {}
          ),
          score: createDto.playerIds.reduce(
            (acc, id) => ({ ...acc, [id]: 0 }),
            {}
          ),
          events: [],
          totalShots: 0,
          totalFouls: 0,
          totalFrames: 0,
        },
      });

      this.logger.log(
        `Created game session ${gameSession.id} for game ${createDto.gameId}`
      );
      return gameSession;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create game session: ${errorMessage}`);
      throw new BadRequestException('Failed to create game session');
    }
  }

  async getGameSession(sessionId: string): Promise<GameSession> {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Game session ${sessionId} not found`);
    }

    return session;
  }

  async getActiveGameSession(gameId: string): Promise<GameSession | null> {
    return this.prisma.gameSession.findFirst({
      where: {
        gameId,
        status: GameSessionStatus.ACTIVE,
      },
    });
  }

  async updateGameSession(
    sessionId: string,
    updateDto: GameSessionUpdateDto
  ): Promise<GameSession> {
    try {
      const updatedSession = await this.prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          ...updateDto,
          lastUpdated: new Date(),
        },
      });

      this.logger.log(`Updated game session ${sessionId}`);
      return updatedSession;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update game session ${sessionId}: ${errorMessage}`
      );
      throw new BadRequestException('Failed to update game session');
    }
  }

  async recordShot(
    sessionId: string,
    shotData: ShotData
  ): Promise<GameSession> {
    const session = await this.getGameSession(sessionId);

    // Update session with shot data
    const currentEvents = Array.isArray(session.events) ? session.events : [];
    const updatedEvents = [
      ...currentEvents,
      {
        type: 'shot',
        ...shotData,
        timestamp: shotData.timestamp.toISOString(),
      },
    ];

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        totalShots: session.totalShots + 1,
        events: updatedEvents,
        lastUpdated: new Date(),
      },
    });

    this.logger.log(`Recorded shot in game session ${sessionId}`);
    return updatedSession;
  }

  async recordFoul(
    sessionId: string,
    playerId: string,
    foulType: string,
    reason: string
  ): Promise<GameSession> {
    const session = await this.getGameSession(sessionId);

    const currentFouls =
      session.fouls && typeof session.fouls === 'object'
        ? (session.fouls as Record<string, number>)
        : {};
    const updatedFouls = {
      ...currentFouls,
      [playerId]: (currentFouls[playerId] || 0) + 1,
    };

    const currentEvents = Array.isArray(session.events) ? session.events : [];
    const updatedEvents = [
      ...currentEvents,
      {
        type: 'foul',
        playerId,
        foulType,
        reason,
        timestamp: new Date().toISOString(),
      },
    ];

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        fouls: updatedFouls,
        totalFouls: session.totalFouls + 1,
        events: updatedEvents,
        lastUpdated: new Date(),
      },
    });

    this.logger.log(
      `Recorded foul in game session ${sessionId} for player ${playerId}`
    );
    return updatedSession;
  }

  async endGameSession(
    sessionId: string,
    winnerId: string
  ): Promise<GameSession> {
    const session = await this.getGameSession(sessionId);
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - session.startTime.getTime()) / 1000
    );

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: GameSessionStatus.COMPLETED,
        endTime,
        duration,
        winnerId,
        lastUpdated: new Date(),
      },
    });

    this.logger.log(`Ended game session ${sessionId} with winner ${winnerId}`);
    return updatedSession;
  }

  async getGameSessionAnalytics(sessionId: string): Promise<any> {
    const session = await this.getGameSession(sessionId);

    const totalShots = session.totalShots;
    const totalFouls = session.totalFouls;
    const totalFrames = session.totalFrames;
    const duration = session.duration || 0;

    // Calculate averages
    const avgShotTime = duration > 0 ? duration / totalShots : 0;
    const avgFrameTime = totalFrames > 0 ? duration / totalFrames : 0;

    return {
      totalShots,
      totalFouls,
      totalFrames,
      duration,
      avgShotTime: Math.round(avgShotTime * 100) / 100,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      playerStats: {
        fouls: session.fouls,
        score: session.score,
      },
    };
  }

  private initializeBallStates(): Record<string, string> {
    // Initialize all 15 balls as 'on_table'
    const ballStates: Record<string, string> = {};
    for (let i = 1; i <= 15; i++) {
      ballStates[i.toString()] = 'on_table';
    }
    return ballStates;
  }
}
