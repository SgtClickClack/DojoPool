import { PrismaClient } from '@prisma/client';
import { Tournament, TournamentState, TournamentType } from '../../types/tournament';

const prisma = new PrismaClient();

export class TournamentService {
  static async createTournament(
    name: string,
    type: TournamentType,
    venueId: string,
    startDate: Date,
    endDate: Date,
    maxParticipants: number,
    entryFee: number,
    prizePool: number
  ): Promise<Tournament> {
    return prisma.tournament.create({
      data: {
        name,
        type,
        venueId,
        startDate,
        endDate,
        maxParticipants,
        entryFee,
        prizePool,
        state: TournamentState.REGISTRATION,
        participants: [],
        matches: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async getTournament(id: string): Promise<Tournament | null> {
    return prisma.tournament.findUnique({
      where: { id },
    });
  }

  static async updateTournamentState(id: string, state: TournamentState): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id },
      data: {
        state,
        updatedAt: new Date(),
      },
    });
  }

  static async addParticipant(tournamentId: string, participantId: string): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        participants: {
          push: participantId,
        },
        updatedAt: new Date(),
      },
    });
  }

  static async removeParticipant(tournamentId: string, participantId: string): Promise<Tournament> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const updatedParticipants = tournament.participants.filter(id => id !== participantId);

    return prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        participants: updatedParticipants,
        updatedAt: new Date(),
      },
    });
  }

  static async addMatch(tournamentId: string, matchId: string): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        matches: {
          push: matchId,
        },
        updatedAt: new Date(),
      },
    });
  }

  static async getActiveTournaments(venueId: string): Promise<Tournament[]> {
    return prisma.tournament.findMany({
      where: {
        venueId,
        state: {
          in: [TournamentState.REGISTRATION, TournamentState.IN_PROGRESS],
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  static async getPlayerTournaments(playerId: string): Promise<Tournament[]> {
    return prisma.tournament.findMany({
      where: {
        participants: {
          has: playerId,
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  static async updateTournamentResults(
    tournamentId: string,
    winnerId: string,
    finalStandings: string[]
  ): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        state: TournamentState.COMPLETED,
        winnerId,
        finalStandings,
        endedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
} 