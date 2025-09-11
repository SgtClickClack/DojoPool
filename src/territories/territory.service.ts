import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TerritoryService {
  constructor(private prisma: PrismaService) {}

  public async claimTerritory(
    playerId: string,
    territoryId: string,
    matchId: string
  ): Promise<void> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
    }

    if (match.winnerId !== playerId) {
      throw new HttpException(
        'Player did not win the match',
        HttpStatus.FORBIDDEN
      );
    }

    const territory = await this.prisma.territory.findUnique({
      where: { id: territoryId },
    });

    if (!territory) {
      throw new HttpException('Territory not found', HttpStatus.NOT_FOUND);
    }

    // Additional validation logic can be added here, e.g.,
    // - Check if the match was recent enough.
    // - Check if the match took place within the territory's boundaries (if venueId is linked to territory).

    await this.prisma.territory.update({
      where: { id: territoryId },
      data: {
        ownerId: playerId,
        lastOwnershipChange: new Date(),
        status: 'CLAIMED',
      },
    });
  }

  public async resolveConflict(territoryId: string): Promise<void> {
    const territory = await this.prisma.territory.findUnique({
      where: { id: territoryId },
      include: {
        contestants: {
          include: {
            matchesAsPlayerA: true,
            matchesAsPlayerB: true,
            profile: true,
          },
        },
      },
    });

    if (!territory || territory.status !== 'CONTESTED') {
      // Not a contested territory, or territory not found
      return;
    }

    const contestants = territory.contestants;

    if (contestants.length === 0) {
      // No contestants, do nothing
      return;
    }

    if (contestants.length === 1) {
      // Only one contestant, they win by default
      await this.prisma.territory.update({
        where: { id: territoryId },
        data: {
          ownerId: contestants[0].id,
          status: 'CLAIMED',
          lastOwnershipChange: new Date(),
          contestants: {
            set: [],
          },
        },
      });
      return;
    }

    // Conflict resolution logic:
    // 1. Highest skill rating wins.
    // 2. If skill ratings are tied, highest win/loss ratio wins.
    let winner = contestants[0];

    for (let i = 1; i < contestants.length; i++) {
      const contestant = contestants[i];

      const winnerSkill = winner.profile?.skillRating || 0;
      const contestantSkill = contestant.profile?.skillRating || 0;

      if (contestantSkill > winnerSkill) {
        winner = contestant;
      } else if (contestantSkill === winnerSkill) {
        const winnerMatches = [
          ...winner.matchesAsPlayerA,
          ...winner.matchesAsPlayerB,
        ];
        const winnerWins = winnerMatches.filter(
          (m) => m.winnerId === winner.id
        ).length;
        const winnerLosses = winnerMatches.length - winnerWins;
        const winnerRatio =
          winnerLosses === 0 ? winnerWins : winnerWins / winnerLosses;

        const contestantMatches = [
          ...contestant.matchesAsPlayerA,
          ...contestant.matchesAsPlayerB,
        ];
        const contestantWins = contestantMatches.filter(
          (m) => m.winnerId === contestant.id
        ).length;
        const contestantLosses = contestantMatches.length - contestantWins;
        const contestantRatio =
          contestantLosses === 0
            ? contestantWins
            : contestantWins / contestantLosses;

        if (contestantRatio > winnerRatio) {
          winner = contestant;
        }
      }
    }

    // Update territory owner
    await this.prisma.territory.update({
      where: { id: territoryId },
      data: {
        ownerId: winner.id,
        status: 'CLAIMED',
        lastOwnershipChange: new Date(),
        contestants: {
          set: [],
        },
      },
    });
  }
}
