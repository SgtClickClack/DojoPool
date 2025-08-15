import { PrismaClient } from "../../../generated/prisma";
import {
  Tournament,
  TournamentStatus,
  TournamentFormat,
} from "../../types/tournament.js";
import axios from 'axios';

const prisma = new PrismaClient();

// TODO: Set up and import a shared configured axios instance 
// (e.g., with base URL, interceptors for auth)
// import { axiosInstance } from '.js'; 
const axiosInstance = axios; // Use base axios for now

/**
 * Service class for interacting with the Tournament API endpoints.
 */
class TournamentAPIService {
  /**
   * Fetches a list of tournaments from the backend.
   * Optionally filters by status.
   *
   * @param status Optional status to filter tournaments by (e.g., 'active').
   * @returns A promise that resolves to an array of Tournament objects.
   */
  async getTournaments(status?: string): Promise<Tournament[]> {
    const endpoint = '/api/tournaments';
    console.log(`Fetching tournaments from ${endpoint} ${status ? `with status: ${status}`: ''}`);
    try {
      const params = status ? { status } : {};
      const response = await axiosInstance.get(endpoint, {
        params,
      });

      // Assuming the backend returns data compatible with the Tournament interface
      // but date fields are strings that need conversion.
      if (!Array.isArray(response.data)) {
          console.error('Invalid data received from tournament API:', response.data);
          throw new Error('Unexpected data format received from server.');
      }
      
      const tournaments: Tournament[] = response.data.map((t: any) => {
        // Basic validation
        if (!t || typeof t !== 'object' || !t.id || !t.name) {
            console.warn('Skipping invalid tournament data:', t);
            return null; // Filter out invalid entries later
        }
        return {
          ...t,
          // Convert string dates to Date objects safely
          startDate: t.startDate ? new Date(t.startDate) : new Date(), // Provide default or handle error?
          endDate: t.endDate ? new Date(t.endDate) : undefined,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(), // Provide default or handle error?
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(), // Provide default or handle error?
          endedAt: t.endedAt ? new Date(t.endedAt) : undefined,
        }
      }).filter((t): t is Tournament => t !== null); // Filter out any nulls from invalid entries

      console.log(`Fetched ${tournaments.length} tournaments.`);
      return tournaments;
    } catch (error) {
      console.error(`Error fetching tournaments from ${endpoint}:`, error);
      // Consider more specific error handling based on error type (e.g., axios error)
      if (axios.isAxiosError(error)) {
          console.error('Axios error details:', error.response?.data);
      }
      throw new Error('Failed to fetch tournaments');
    }
  }

  // TODO: Add methods for other tournament actions
}

// Export a singleton instance of the service
export const tournamentApiService = new TournamentAPIService();

// Rename the class to avoid conflict
export class TournamentDBService {
  static async createTournament(
    name: string,
    format: TournamentFormat,
    venueId: string,
    startDate: Date,
    endDate: Date,
    maxParticipants: number,
    entryFee: number,
    prizePool: number,
  ): Promise<Tournament> {
    return prisma.tournament.create({
      data: {
        name,
        format,
        venueId,
        startDate,
        endDate,
        maxParticipants,
        entryFee,
        prizePool,
        status: TournamentStatus.OPEN,
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
    status: TournamentStatus,
  ): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  static async addParticipant(
    tournamentId: string,
    participantId: string,
  ): Promise<Tournament> {
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

  static async removeParticipant(
    tournamentId: string,
    participantId: string,
  ): Promise<Tournament> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const updatedParticipants = tournament.participants.filter(
      (id) => id !== participantId,
    );

    return prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        participants: updatedParticipants,
        updatedAt: new Date(),
      },
    });
  }

  static async addMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<Tournament> {
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
        status: {
          in: [TournamentStatus.OPEN, TournamentStatus.ACTIVE],
        },
      },
      orderBy: {
        startDate: "asc",
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
        startDate: "desc",
      },
    });
  }

  static async updateTournamentResults(
    tournamentId: string,
    winnerId: string,
    finalStandings: string[],
  ): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: TournamentStatus.COMPLETED,
        winnerId,
        finalStandings,
        endedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
