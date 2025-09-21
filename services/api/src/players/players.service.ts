import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorUtils } from '../common';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(private _prisma: PrismaService) {}

  async getPlayerById(playerId: string): Promise<any> {
    try {
      // Get basic user information
      const user = await this._prisma.user.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          username: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new Error('Player not found');
      }

      // Get tournament participation
      const tournamentParticipations =
        await this._prisma.tournamentParticipant.findMany({
          where: { userId: playerId },
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
                endDate: true,
                venue: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

      // Get match history
      const matches = await this._prisma.match.findMany({
        where: {
          OR: [{ playerAId: playerId }, { playerBId: playerId }],
        },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              venue: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
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
        orderBy: { createdAt: 'desc' },
      });

      // Calculate statistics
      const totalMatches = matches.length;
      const wins = matches.filter((match) => {
        if (
          match.status === 'COMPLETED' &&
          match.scoreA !== null &&
          match.scoreB !== null
        ) {
          return (
            (match.playerAId === playerId && match.scoreA > match.scoreB) ||
            (match.playerBId === playerId && match.scoreB > match.scoreA)
          );
        }
        return false;
      }).length;
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

      // Get achievements (placeholder data for now)
      const achievements = [
        {
          id: 'first-match',
          name: 'First Match',
          description: 'Played your first match',
          icon: '🎯',
          unlocked: totalMatches > 0,
          unlockedAt: totalMatches > 0 ? user.createdAt : null,
        },
        {
          id: 'first-win',
          name: 'First Victory',
          description: 'Won your first match',
          icon: '🏆',
          unlocked: wins > 0,
          unlockedAt:
            wins > 0
              ? matches.find((m) => {
                  if (
                    m.status === 'COMPLETED' &&
                    m.scoreA !== null &&
                    m.scoreB !== null
                  ) {
                    return (
                      (m.playerAId === playerId && m.scoreA > m.scoreB) ||
                      (m.playerBId === playerId && m.scoreB > m.scoreA)
                    );
                  }
                  return false;
                })?.createdAt
              : null,
        },
        {
          id: 'tournament-participant',
          name: 'Tournament Participant',
          description: 'Joined your first tournament',
          icon: '🎮',
          unlocked: tournamentParticipations.length > 0,
          unlockedAt:
            tournamentParticipations.length > 0
              ? tournamentParticipations[0].createdAt
              : null,
        },
        {
          id: 'winning-streak',
          name: 'Winning Streak',
          description: 'Won 3 matches in a row',
          icon: '🔥',
          unlocked: false, // TODO: Implement streak calculation
          unlockedAt: null,
        },
      ];

      return {
        ...user,
        statistics: {
          totalMatches,
          wins,
          losses,
          winRate: Math.round(winRate * 100) / 100,
          tournamentsJoined: tournamentParticipations.length,
        },
        tournamentParticipations,
        matches,
        achievements,
      };
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('fetch player', playerId, err)
      );
      throw err;
    }
  }
}
