import { Injectable, Logger } from '@nestjs/common';
import type { Prisma, Tournament } from '@prisma/client';
import { AchievementsService } from '../achievements/achievements.service';
import { ErrorUtils, MatchUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(
    private prisma: PrismaService,
    private achievementsService: AchievementsService
  ) {}

  // Backwards-compat create used by VenueTournamentsController
  async create(dto: any, venueId: string): Promise<Tournament> {
    try {
      const data: Prisma.TournamentCreateInput = {
        name: dto.name,
        startDate: dto.startTime ?? new Date(),
        endDate: dto.endTime ?? null,
        venue: { connect: { id: venueId } },
        status: 'REGISTRATION',
        maxPlayers: dto.maxParticipants ?? dto.maxPlayers ?? null,
        entryFee: dto.entryFee ?? null,
        prizePool: dto.prizePool ?? null,
      } as any;
      return await this.prisma.tournament.create({ data });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('create tournament', undefined, err)
      );
      throw err;
    }
  }

  async createTournament(
    data: Prisma.TournamentCreateInput
  ): Promise<Tournament> {
    try {
      return await this.prisma.tournament.create({ data });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('create tournament', undefined, err)
      );
      throw err;
    }
  }

  async findTournamentsByVenue(venueId: string): Promise<Tournament[]> {
    try {
      return await this.prisma.tournament.findMany({
        where: { venueId },
        include: { venue: true },
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'fetch tournaments by venue',
          venueId,
          err
        )
      );
      throw err;
    }
  }

  async findAllTournaments(): Promise<Tournament[]> {
    try {
      return await this.prisma.tournament.findMany({
        include: {
          venue: true,
        },
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('fetch tournaments', undefined, err)
      );
      throw err;
    }
  }

  async findOneTournament(id: string): Promise<Tournament> {
    try {
      const tournament = await this.prisma.tournament.findUnique({
        where: { id },
        include: {
          venue: true,
        },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      return tournament;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('fetch tournament', id, err)
      );
      throw err;
    }
  }

  async updateTournament(
    id: string,
    data: Prisma.TournamentUpdateInput
  ): Promise<Tournament> {
    try {
      const tournament = await this.prisma.tournament.update({
        where: { id },
        data,
        include: {
          venue: true,
        },
      });

      return tournament;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('update tournament', id, err)
      );
      throw err;
    }
  }

  async removeTournament(id: string): Promise<void> {
    try {
      await this.prisma.tournament.delete({
        where: { id },
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('delete tournament', id, err)
      );
      throw err;
    }
  }

  async registerPlayer(
    tournamentId: string,
    registerDto: { playerId: string }
  ): Promise<Tournament> {
    try {
      // Check if tournament exists and is open for registration
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { venue: true },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'REGISTRATION') {
        throw new Error('Tournament is not open for registration');
      }

      // Check if player is already registered
      const existingParticipant =
        await this.prisma.tournamentParticipant.findFirst({
          where: {
            tournamentId,
            userId: registerDto.playerId,
          },
        });

      if (existingParticipant) {
        throw new Error('Player is already registered for this tournament');
      }

      // Get current participant count
      const participantCount = await this.prisma.tournamentParticipant.count({
        where: { tournamentId },
      });

      // Check if tournament is full (assuming maxParticipants is stored in tournament data)
      // For now, we'll use a reasonable default
      const maxParticipants = 32; // This should come from tournament data
      if (participantCount >= maxParticipants) {
        throw new Error('Tournament is full');
      }

      // Add player to participants
      await this.prisma.tournamentParticipant.create({
        data: {
          tournamentId,
          userId: registerDto.playerId,
        },
      });

      // Get updated tournament
      const updatedTournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { venue: true },
      });

      return updatedTournament!;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'register player for tournament',
          tournamentId,
          err
        )
      );
      throw err;
    }
  }

  async unregisterPlayer(
    tournamentId: string,
    unregisterDto: { playerId: string }
  ): Promise<Tournament> {
    try {
      // Check if tournament exists
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { venue: true },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'REGISTRATION') {
        throw new Error('Cannot unregister from tournament that is not open');
      }

      // Check if player is registered
      const existingParticipant =
        await this.prisma.tournamentParticipant.findFirst({
          where: {
            tournamentId,
            userId: unregisterDto.playerId,
          },
        });

      if (!existingParticipant) {
        throw new Error('Player is not registered for this tournament');
      }

      // Remove player from participants
      await this.prisma.tournamentParticipant.delete({
        where: { id: existingParticipant.id },
      });

      // Get updated tournament
      const updatedTournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { venue: true },
      });

      return updatedTournament!;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'unregister player from tournament',
          tournamentId,
          err
        )
      );
      throw err;
    }
  }

  async startTournament(tournamentId: string): Promise<Tournament> {
    try {
      // Check if tournament exists
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          venue: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'REGISTRATION') {
        throw new Error('Tournament is not open for starting');
      }

      // Check if tournament has enough participants (minimum 2)
      if (tournament.participants.length < 2) {
        throw new Error('Tournament needs at least 2 participants to start');
      }

      // Generate tournament bracket
      await this.generateTournamentBracket(
        tournamentId,
        tournament.participants
      );

      // Update tournament status to ACTIVE
      const updatedTournament = await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: 'ACTIVE',
        },
        include: { venue: true },
      });

      this.logger.log(
        `Tournament ${tournamentId} started successfully with ${tournament.participants.length} participants`
      );

      return updatedTournament;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('start tournament', tournamentId, err)
      );
      throw err;
    }
  }

  private async generateTournamentBracket(
    tournamentId: string,
    participants: any[]
  ): Promise<void> {
    try {
      // Get tournament to access venueId
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { venueId: true },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Shuffle participants for random seeding
      const shuffledParticipants = this.shuffleArray([...participants]);

      // Create first round matches
      const matches = [];
      for (let i = 0; i < shuffledParticipants.length; i += 2) {
        if (i + 1 < shuffledParticipants.length) {
          // Create match between two participants
          matches.push({
            tournamentId,
            venueId: tournament.venueId,
            playerAId: shuffledParticipants[i].userId,
            playerBId: shuffledParticipants[i + 1].userId,
            round: 1,
            status: 'PENDING' as const,
          });
        } else {
          // Handle odd number of participants - give the last player a bye
          this.logger.log(
            `Player ${shuffledParticipants[i].user.username} gets a bye in round 1`
          );
        }
      }

      // Save all matches to database
      for (const matchData of matches) {
        await this.prisma.match.create({
          data: matchData,
        });
      }

      this.logger.log(
        `Generated ${matches.length} first-round matches for tournament ${tournamentId}`
      );
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'generate tournament bracket',
          tournamentId,
          err
        )
      );
      throw err;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async findTournamentMatches(tournamentId: string): Promise<any[]> {
    try {
      const matches = await this.prisma.match.findMany({
        where: { tournamentId },
        include: {
          playerA: {
            select: {
              id: true,
              username: true,
            },
          },
          playerB: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
      });

      return matches;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'fetch matches for tournament',
          tournamentId,
          err
        )
      );
      throw err;
    }
  }

  async updateMatch(
    matchId: string,
    updateMatchDto: { scoreA: number; scoreB: number; winnerId: string }
  ): Promise<any> {
    try {
      // Get the current match
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          tournament: true,
        },
      });

      if (!match) {
        throw new Error('Match not found');
      }

      if (!match.tournament) {
        throw new Error('Match is not associated with a tournament');
      }

      // Determine winner and loser
      const winnerId = updateMatchDto.winnerId;
      const loserId =
        winnerId === match.playerAId ? match.playerBId : match.playerAId;

      // Update the match
      const updatedMatch = await this.prisma.match.update({
        where: { id: matchId },
        data: {
          scoreA: updateMatchDto.scoreA,
          scoreB: updateMatchDto.scoreB,
          winnerId: winnerId,
          loserId: loserId,
          status: 'COMPLETED',
          endedAt: new Date(),
        },
        include: {
          playerA: {
            select: {
              id: true,
              username: true,
            },
          },
          playerB: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // Check if we can advance the bracket
      await this.advanceBracket(match.tournament.id, match.round);

      // Check and award achievements for the winner
      try {
        const awardedAchievements =
          await this.achievementsService.checkAndAwardAchievements(winnerId);
        if (awardedAchievements.length > 0) {
          this.logger.log(
            `Awarded achievements to winner ${winnerId}: ${awardedAchievements.join(
              ', '
            )}`
          );
        }
      } catch (achievementError) {
        this.logger.warn(
          `Failed to check achievements for winner ${winnerId}: ${achievementError}`
        );
        // Don't fail the match update if achievements fail
      }

      this.logger.log(
        `Match ${matchId} completed. Winner: ${winnerId}, Loser: ${loserId}`
      );

      return updatedMatch;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('update match', matchId, err)
      );
      throw err;
    }
  }

  private async advanceBracket(
    tournamentId: string,
    completedRound: number
  ): Promise<void> {
    try {
      // Get all matches for the tournament
      const allMatches = await this.prisma.match.findMany({
        where: { tournamentId },
        orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
      });

      // Check if all matches in the current round are completed
      const currentRoundMatches = allMatches.filter(
        (m) => m.round === completedRound
      );
      const completedMatches = currentRoundMatches.filter(
        (m) => m.status === 'COMPLETED'
      );

      if (completedMatches.length < currentRoundMatches.length) {
        // Not all matches in this round are complete yet
        return;
      }

      // Get the next round number
      const nextRound = completedRound + 1;

      // Check if we already have matches for the next round
      const nextRoundMatches = allMatches.filter((m) => m.round === nextRound);
      if (nextRoundMatches.length > 0) {
        // Next round already exists
        return;
      }

      // Get tournament to access venueId
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { venueId: true },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Create next round matches
      const winners = completedMatches.map((m) => m.winnerId!).filter(Boolean);
      const newMatches = [];

      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          // Create match between two winners
          newMatches.push({
            tournamentId,
            venueId: tournament.venueId,
            playerAId: winners[i],
            playerBId: winners[i + 1],
            round: nextRound,
            status: 'PENDING' as const,
          });
        } else {
          // Handle odd number of winners - give the last player a bye
          this.logger.log(
            `Player ${winners[i]} gets a bye in round ${nextRound}`
          );
        }
      }

      // Save all new matches to database
      for (const matchData of newMatches) {
        await this.prisma.match.create({
          data: matchData,
        });
      }

      if (newMatches.length > 0) {
        this.logger.log(
          `Created ${newMatches.length} matches for round ${nextRound} in tournament ${tournamentId}`
        );
      }

      // Check if tournament is complete (only one player left)
      if (newMatches.length === 1 && winners.length === 2) {
        // Tournament is complete - update status
        await this.prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: 'COMPLETED' },
        });
        this.logger.log(`Tournament ${tournamentId} completed!`);
      }
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'advance bracket for tournament',
          tournamentId,
          err
        )
      );
      throw err;
    }
  }

  async getMatchById(matchId: string): Promise<any> {
    return MatchUtils.getMatchById(this.prisma, matchId);
  }
}
