import { PrismaClient } from "@prisma/client";
import {
  Tournament,
  TournamentState,
  TournamentType,
} from "../../types/tournament";

const prisma = new PrismaClient();

export class TournamentService {
  static async createTournament(
    name: string,
    type: TournamentType,
    startDate: Date,
    endDate: Date,
    venueId: string,
    organizerId: string,
    maxParticipants: number,
    entryFee: number,
  ): Promise<Tournament> {
    return prisma.tournament.create({
      data: {
        name,
        type,
        startDate,
        endDate,
        venueId,
        organizerId,
        maxParticipants,
        entryFee,
        state: TournamentState.REGISTRATION,
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

  static async updateTournamentState(
    id: string,
    state: TournamentState,
  ): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id },
      data: {
        state,
        updatedAt: new Date(),
      },
    });
  }

  static async addParticipant(
    tournamentId: string,
    playerId: string,
  ): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        participants: {
          connect: { id: playerId },
        },
        updatedAt: new Date(),
      },
    });
  }

  static async removeParticipant(
    tournamentId: string,
    playerId: string,
  ): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        participants: {
          disconnect: { id: playerId },
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
        startDate: "asc",
      },
    });
  }

  static async getTournamentsForPlayer(
    playerId: string,
  ): Promise<Tournament[]> {
    return prisma.tournament.findMany({
      where: {
        participants: {
          some: { id: playerId },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });
  }

  static async updateTournamentResults(
    tournamentId: string,
    winnerId: string,
    runnerUpId: string,
  ): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        winnerId,
        runnerUpId,
        state: TournamentState.COMPLETED,
        endedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
