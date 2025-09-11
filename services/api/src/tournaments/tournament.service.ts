import {
  ActivityType,
  BracketStatus,
  ParticipantStatus,
  TournamentStatus,
} from '@dojopool/prisma';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CacheInvalidate, Cacheable } from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { JoinTournamentDto } from './dto/join-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@Injectable()
export class TournamentService {
  private readonly logger = new Logger(TournamentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly cacheHelper: CacheHelper
  ) {}

  /**
   * Create a new tournament
   */
  @CacheInvalidate(['tournaments:list:*'])
  async create(createTournamentDto: CreateTournamentDto, adminId: string) {
    const tournament = await this.prisma.tournament.create({
      data: {
        name: createTournamentDto.name,
        description: createTournamentDto.description,
        eventId: createTournamentDto.eventId,
        venueId: createTournamentDto.venueId || '',
        startDate: new Date(createTournamentDto.startDate),
        endTime: createTournamentDto.endTime
          ? new Date(createTournamentDto.endTime)
          : null,
        maxPlayers: createTournamentDto.maxParticipants || 16,
        currentPlayers: 0,
        currentParticipants: 0,
        entryFee: createTournamentDto.entryFee || 0,
        prizePool: createTournamentDto.prizePool || 0,
        format: createTournamentDto.format || 'SINGLE_ELIMINATION',
        rules: JSON.stringify(createTournamentDto.rules || {}),
        organizerId: adminId,
      },
      include: {
        venue: true,
        event: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        bracket: true,
        matches: {
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
            winner: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `Tournament created: ${tournament.name} by admin ${adminId}`
    );
    return tournament;
  }

  /**
   * Get all tournaments with filtering
   */
  @Cacheable({
    ttl: 300, // 5 minutes cache
    keyPrefix: 'tournaments:list',
    keyGenerator: (filters) => {
      const { status, venueId, page = 1, limit = 20 } = filters || {};
      return `${status || 'all'}:${venueId || 'all'}:${page}:${limit}`;
    },
  })
  async findAll(filters?: {
    status?: TournamentStatus;
    venueId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, venueId, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (venueId) {
      where.venueId = venueId;
    }

    const [tournaments, totalCount] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        include: {
          venue: true,
          event: true,
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profile: {
                    select: {
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              participants: true,
              matches: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.tournament.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      tournaments,
      totalCount,
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get tournament by ID with full details
   */
  @Cacheable({
    ttl: 600, // 10 minutes cache for individual tournaments
    keyPrefix: 'tournaments:detail',
    keyGenerator: (id) => id,
  })
  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        venue: true,
        event: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: { seed: 'asc' },
        },
        matches: {
          include: {
            playerA: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
            playerB: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
            winner: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { startedAt: 'asc' },
        },
        bracket: true,
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  /**
   * Update tournament
   */
  @CacheInvalidate(['tournaments:list:*', 'tournaments:detail:*'])
  async update(
    id: string,
    updateTournamentDto: UpdateTournamentDto,
    adminId: string
  ) {
    const existingTournament = await this.findOne(id);

    // Prevent updates if tournament is in progress or completed
    if (
      existingTournament.status === TournamentStatus.IN_PROGRESS ||
      existingTournament.status === TournamentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Cannot update tournament that is in progress or completed'
      );
    }

    const tournament = await this.prisma.tournament.update({
      where: { id },
      data: {
        ...(updateTournamentDto.name && { name: updateTournamentDto.name }),
        ...(updateTournamentDto.description && {
          description: updateTournamentDto.description,
        }),
        ...(updateTournamentDto.startDate && {
          startDate: new Date(updateTournamentDto.startDate),
        }),
        ...(updateTournamentDto.endTime && {
          endTime: updateTournamentDto.endTime
            ? new Date(updateTournamentDto.endTime)
            : null,
        }),
        ...(updateTournamentDto.maxParticipants && {
          maxPlayers: updateTournamentDto.maxParticipants,
        }),
        ...(updateTournamentDto.entryFee !== undefined && {
          entryFee: updateTournamentDto.entryFee,
        }),
        ...(updateTournamentDto.prizePool !== undefined && {
          prizePool: updateTournamentDto.prizePool,
        }),
        ...(updateTournamentDto.format && {
          format: updateTournamentDto.format,
        }),
        ...(updateTournamentDto.rules && {
          rules: JSON.stringify(updateTournamentDto.rules),
        }),
        ...(updateTournamentDto.status && {
          status: updateTournamentDto.status,
        }),
        updatedAt: new Date(),
      },
      include: {
        venue: true,
        event: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    this.logger.log(`Tournament updated: ${id} by admin ${adminId}`);
    return tournament;
  }

  /**
   * Delete tournament
   */
  @CacheInvalidate(['tournaments:list:*', 'tournaments:detail:*'])
  async delete(id: string, adminId: string) {
    const tournament = await this.findOne(id);

    // Prevent deletion if tournament has started
    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new BadRequestException(
        'Cannot delete tournament that has started'
      );
    }

    await this.prisma.tournament.delete({ where: { id } });

    this.logger.log(`Tournament deleted: ${id} by admin ${adminId}`);
    return { success: true };
  }

  /**
   * Join tournament
   */
  @CacheInvalidate(['tournaments:list:*', 'tournaments:detail:*'])
  async joinTournament(
    tournamentId: string,
    joinTournamentDto: JoinTournamentDto,
    userId: string
  ) {
    const tournament = await this.findOne(tournamentId);

    // Check if tournament allows registration
    if (
      tournament.status !== TournamentStatus.UPCOMING &&
      tournament.status !== TournamentStatus.REGISTRATION_OPEN
    ) {
      throw new BadRequestException('Tournament registration is not open');
    }

    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxPlayers) {
      throw new BadRequestException('Tournament is full');
    }

    // Check if user is already registered
    const existingParticipant =
      await this.prisma.tournamentParticipant.findUnique({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId,
          },
        },
      });

    if (existingParticipant) {
      throw new BadRequestException(
        'User is already registered for this tournament'
      );
    }

    // Check entry fee
    if (tournament.entryFee > 0) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { dojoCoinBalance: true },
      });

      if (!user || user.dojoCoinBalance < tournament.entryFee) {
        throw new BadRequestException(
          'Insufficient DojoCoins for tournament entry'
        );
      }

      // Deduct entry fee
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          dojoCoinBalance: {
            decrement: tournament.entryFee,
          },
        },
      });

      // Update prize pool
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          prizePool: {
            increment: tournament.entryFee,
          },
        },
      });
    }

    // Register participant
    const participant = await this.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId,
        status: ParticipantStatus.REGISTERED,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
            skillRating: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            entryFee: true,
          },
        },
      },
    });

    // Update participant count
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        currentParticipants: {
          increment: 1,
        },
      },
    });

    this.logger.log(`User ${userId} joined tournament ${tournamentId}`);
    return participant;
  }

  /**
   * Leave tournament
   */
  @CacheInvalidate(['tournaments:list:*', 'tournaments:detail:*'])
  async leaveTournament(tournamentId: string, userId: string) {
    const tournament = await this.findOne(tournamentId);

    // Check if tournament allows leaving
    if (
      tournament.status !== TournamentStatus.UPCOMING &&
      tournament.status !== TournamentStatus.REGISTRATION_OPEN
    ) {
      throw new BadRequestException('Cannot leave tournament that has started');
    }

    const participant = await this.prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found in tournament');
    }

    // Refund entry fee if applicable
    if (tournament.entryFee > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          dojoCoinBalance: {
            increment: tournament.entryFee,
          },
        },
      });

      // Update prize pool
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          prizePool: {
            decrement: tournament.entryFee,
          },
        },
      });
    }

    // Remove participant
    await this.prisma.tournamentParticipant.delete({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    });

    // Update participant count
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        currentParticipants: {
          decrement: 1,
        },
      },
    });

    this.logger.log(`User ${userId} left tournament ${tournamentId}`);
    return { success: true };
  }

  /**
   * Get tournament bracket
   */
  @Cacheable({
    ttl: 180, // 3 minutes cache for bracket data (shorter due to frequent updates)
    keyPrefix: 'tournaments:bracket',
    keyGenerator: (tournamentId) => tournamentId,
  })
  async getTournamentBracket(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        bracket: true,
        matches: {
          include: {
            playerA: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
            playerB: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
            winner: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        currentRound: tournament.bracket?.currentRound || 1,
        totalRounds: tournament.bracket?.totalRounds || 4,
        status: tournament.bracket?.status || BracketStatus.PENDING,
      },
      bracket: tournament.bracket,
      matches: tournament.matches,
    };
  }

  /**
   * Generate tournament bracket
   */
  @CacheInvalidate(['tournaments:detail:*', 'tournaments:bracket:*'])
  async generateBracket(tournamentId: string, adminId: string) {
    const tournament = await this.findOne(tournamentId);

    // Check if tournament can have bracket generated
    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new BadRequestException(
        'Cannot generate bracket for tournament that has started'
      );
    }

    if (tournament.participants.length < 2) {
      throw new BadRequestException('Tournament needs at least 2 participants');
    }

    // Assign seeds to participants (no skill rating sorting)
    const sortedParticipants = tournament.participants.map(
      (participant, index) => ({
        ...participant,
        seed: index + 1,
      })
    );

    // Update participant seeds
    await Promise.all(
      sortedParticipants.map((participant) =>
        this.prisma.tournamentParticipant.update({
          where: { id: participant.id },
          data: { seed: participant.seed },
        })
      )
    );

    // Generate bracket structure based on tournament format
    const bracketStructure = this.generateBracketStructure(
      tournament.format as any,
      sortedParticipants.length
    );

    // Create or update bracket
    const bracket = await this.prisma.bracket.upsert({
      where: { tournamentId },
      update: {
        structure: JSON.stringify(bracketStructure),
        currentRound: 1,
        totalRounds: bracketStructure.totalRounds,
        status: BracketStatus.NOT_STARTED,
        updatedAt: new Date(),
      },
      create: {
        tournamentId,
        structure: JSON.stringify(bracketStructure),
        currentRound: 1,
        totalRounds: bracketStructure.totalRounds,
        status: BracketStatus.NOT_STARTED,
      },
    });

    // Generate initial round matches
    await this.generateRoundMatches(tournamentId, 1, sortedParticipants);

    this.logger.log(
      `Bracket generated for tournament ${tournamentId} by admin ${adminId}`
    );
    return bracket;
  }

  /**
   * Start tournament
   */
  @CacheInvalidate([
    'tournaments:list:*',
    'tournaments:detail:*',
    'tournaments:bracket:*',
  ])
  async startTournament(tournamentId: string, adminId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        venue: true,
        event: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        bracket: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new BadRequestException('Tournament cannot be started');
    }

    if (tournament.participants.length < 2) {
      throw new BadRequestException(
        'Tournament needs at least 2 participants to start'
      );
    }

    // Generate bracket if it doesn't exist
    if (!tournament.bracket) {
      await this.generateBracket(tournamentId, adminId);
    }

    // Update tournament status
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: TournamentStatus.IN_PROGRESS,
        startDate: new Date(),
      },
    });

    // Update bracket status
    if (tournament.bracket) {
      await this.prisma.bracket.update({
        where: { tournamentId },
        data: {
          status: BracketStatus.IN_PROGRESS,
        },
      });
    }

    this.logger.log(`Tournament started: ${tournamentId} by admin ${adminId}`);
    return { success: true };
  }

  /**
   * Generate bracket structure based on format
   */
  private generateBracketStructure(format: string, participantCount: number) {
    const rounds = Math.ceil(Math.log2(participantCount));
    const totalRounds = format === 'SINGLE_ELIMINATION' ? rounds : rounds * 2;

    return {
      format,
      participantCount,
      totalRounds,
      rounds: Array.from({ length: totalRounds }, (_, roundIndex) => ({
        round: roundIndex + 1,
        matches: Math.pow(2, Math.max(0, rounds - roundIndex - 1)),
        status: roundIndex === 0 ? 'UPCOMING' : 'PENDING',
      })),
    };
  }

  /**
   * Generate matches for a specific round
   */
  private async generateRoundMatches(
    tournamentId: string,
    round: number,
    participants: any[]
  ) {
    // For single elimination, pair highest seed with lowest seed
    const matches = [];
    const participantCount = participants.length;
    const roundsNeeded = Math.ceil(Math.log2(participantCount));

    if (round === 1) {
      // First round pairing
      for (let i = 0; i < participantCount; i += 2) {
        if (i + 1 < participantCount) {
          const match = await this.prisma.match.create({
            data: {
              tournamentId,
              playerAId: participants[i].userId,
              playerBId: participants[i + 1].userId,
              isRanked: true,
            },
          });
          matches.push(match);
        } else {
          // Handle odd number of participants (bye)
          // This player automatically advances to next round
        }
      }
    }

    return matches;
  }

  /**
   * Advance tournament to next round
   */
  @CacheInvalidate([
    'tournaments:list:*',
    'tournaments:detail:*',
    'tournaments:bracket:*',
  ])
  async advanceTournamentRound(tournamentId: string, adminId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        venue: true,
        event: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        bracket: true,
        matches: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Tournament is not in progress');
    }

    if (!tournament.bracket) {
      throw new BadRequestException('Tournament bracket not found');
    }

    const currentRound = tournament.bracket.currentRound;
    const totalRounds = tournament.bracket.totalRounds;

    if (currentRound >= totalRounds) {
      // Tournament is complete
      await this.completeTournament(tournamentId);
      return { success: true, completed: true };
    }

    // Check if tournament has pending matches
    const pendingMatches = tournament.matches.filter(
      (match) => match.status !== 'COMPLETED'
    );

    if (pendingMatches.length > 0) {
      throw new BadRequestException('Tournament has pending matches');
    }

    // Generate next round matches
    const winners = tournament.matches
      .filter((match) => match.status === 'COMPLETED')
      .map((match) => match.winnerId)
      .filter(Boolean);
    await this.generateRoundMatches(
      tournamentId,
      currentRound + 1,
      winners as any[]
    );

    // Update bracket
    await this.prisma.bracket.update({
      where: { tournamentId },
      data: {
        currentRound: currentRound + 1,
      },
    });

    this.logger.log(
      `Tournament ${tournamentId} advanced to round ${currentRound + 1} by admin ${adminId}`
    );
    return { success: true, nextRound: currentRound + 1 };
  }

  /**
   * Complete tournament
   */
  private async completeTournament(tournamentId: string) {
    const tournament = await this.findOne(tournamentId);

    // Find the winner from completed matches
    const completedMatches = tournament.matches.filter(
      (match) => match.status === 'COMPLETED'
    );

    if (completedMatches.length > 0) {
      // For simplicity, take the last completed match winner
      const finalMatch = completedMatches[completedMatches.length - 1];
      if (finalMatch.winnerId) {
        const winnerId = finalMatch.winnerId;

        // Update tournament status
        await this.prisma.tournament.update({
          where: { id: tournamentId },
          data: {
            status: TournamentStatus.COMPLETED,
            endTime: new Date(),
          },
        });

        // Update bracket status
        if (tournament.bracket) {
          await this.prisma.bracket.update({
            where: { tournamentId },
            data: {
              status: BracketStatus.COMPLETED,
            },
          });
        }

        // Award prizes (simplified - in real implementation, distribute prize pool)
        if (tournament.prizePool > 0) {
          await this.prisma.user.update({
            where: { id: winnerId },
            data: {
              dojoCoinBalance: {
                increment: tournament.prizePool,
              },
            },
          });
        }

        // Create activity feed event for tournament win
        await this.prisma.activity.create({
          data: {
            userId: winnerId,
            type: ActivityType.TOURNAMENT_WIN,
            details: JSON.stringify({
              tournamentName: tournament.name,
              tournamentId: tournament.id,
              prizePool: tournament.prizePool,
            }),
          },
        });

        this.logger.log(
          `Tournament ${tournamentId} completed. Winner: ${winnerId}`
        );
      }
    }
  }

  /**
   * Get user's tournament participation history
   */
  @Cacheable({
    ttl: 600, // 10 minutes cache for user history
    keyPrefix: 'tournaments:user:history',
    keyGenerator: (userId, page, limit) => `${userId}:${page}:${limit}`,
  })
  async getUserTournamentHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [participations, totalCount] = await Promise.all([
      this.prisma.tournamentParticipant.findMany({
        where: { userId },
        include: {
          tournament: {
            include: {
              venue: true,
              _count: {
                select: {
                  participants: true,
                  matches: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tournamentParticipant.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      participations,
      totalCount,
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}
