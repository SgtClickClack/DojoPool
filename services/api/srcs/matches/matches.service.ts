import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service responsible for handling business logic related to matches.
 */
@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if a user is a participant in a given match.
   * @param userId The ID of the user.
   * @param matchId The ID of the match.
   * @returns A promise that resolves to true if the user is in the match, otherwise false.
   */
  async isUserInMatch(userId: string, matchId: string): Promise<boolean> {
    const match = await this.prisma.match.findFirst({
      where: {
        // ... existing code ...
      },
    });
    return !!match;
  }
}
