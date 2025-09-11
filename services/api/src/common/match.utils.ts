import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorUtils } from './error.utils';

export class MatchUtils {
  private static readonly logger = new Logger(MatchUtils.name);

  /**
   * Fetches a match by ID with all related data
   * @param prisma - Prisma service instance
   * @param matchId - The match ID to fetch
   * @returns Promise<any> - The match with all related data
   */
  static async getMatchById(
    prisma: PrismaService,
    matchId: string
  ): Promise<any> {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
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

      if (!match) {
        throw new Error('Match not found');
      }

      return match;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('fetch match', matchId, err)
      );
      throw err;
    }
  }
}
