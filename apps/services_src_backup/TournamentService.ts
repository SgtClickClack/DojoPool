import {
  Match,
  Tournament,
  TournamentParticipant,
  apiService,
} from './ApiService';

export class TournamentService {
  /**
   * Fetch all available tournaments from the API
   */
  async getAvailableTournaments(): Promise<Tournament[]> {
    try {
      console.log('🏆 Fetching available tournaments from API...');
      const tournaments = await apiService.getTournaments();
      console.log(`✅ Retrieved ${tournaments.length} tournaments from API`);
      return tournaments;
    } catch (error) {
      console.error('❌ Failed to fetch tournaments:', error);
      throw new Error('Failed to fetch tournaments. Please try again later.');
    }
  }

  /**
   * Fetch a specific tournament by ID
   */
  async getTournamentById(id: string): Promise<Tournament> {
    try {
      console.log(`🏆 Fetching tournament ${id} from API...`);
      const tournament = await apiService.getTournamentById(id);
      console.log(`✅ Retrieved tournament: ${tournament.name}`);
      return tournament;
    } catch (error) {
      console.error(`❌ Failed to fetch tournament ${id}:`, error);
      throw new Error(`Failed to fetch tournament. Please try again later.`);
    }
  }

  /**
   * Create a new tournament
   */
  async createTournament(
    tournamentData: Partial<Tournament>
  ): Promise<Tournament> {
    try {
      console.log('🏆 Creating new tournament...', tournamentData);
      const tournament = await apiService.createTournament(tournamentData);
      console.log(`✅ Tournament created successfully: ${tournament.name}`);
      return tournament;
    } catch (error) {
      console.error('❌ Failed to create tournament:', error);
      throw new Error('Failed to create tournament. Please try again later.');
    }
  }

  /**
   * Update an existing tournament
   */
  async updateTournament(
    id: string,
    tournamentData: Partial<Tournament>
  ): Promise<Tournament> {
    try {
      console.log(`🏆 Updating tournament ${id}...`, tournamentData);
      const tournament = await apiService.updateTournament(id, tournamentData);
      console.log(`✅ Tournament updated successfully: ${tournament.name}`);
      return tournament;
    } catch (error) {
      console.error(`❌ Failed to update tournament ${id}:`, error);
      throw new Error('Failed to update tournament. Please try again later.');
    }
  }

  /**
   * Delete a tournament
   */
  async deleteTournament(id: string): Promise<void> {
    try {
      console.log(`🏆 Deleting tournament ${id}...`);
      await apiService.deleteTournament(id);
      console.log(`✅ Tournament ${id} deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete tournament ${id}:`, error);
      throw new Error('Failed to delete tournament. Please try again later.');
    }
  }

  /**
   * Register a player for a tournament
   */
  async registerPlayerForTournament(
    tournamentId: string,
    userId: string
  ): Promise<Tournament> {
    try {
      console.log(
        `👤 Registering player ${userId} for tournament ${tournamentId}...`
      );
      const tournament = await apiService.registerForTournament(
        tournamentId,
        userId
      );
      console.log(
        `✅ Player registered successfully for tournament: ${tournament.name}`
      );
      return tournament;
    } catch (error) {
      console.error(
        `❌ Failed to register player for tournament ${tournamentId}:`,
        error
      );
      throw new Error(
        'Failed to register for tournament. Please try again later.'
      );
    }
  }

  /**
   * Unregister a player from a tournament
   */
  async unregisterPlayerFromTournament(
    tournamentId: string,
    userId: string
  ): Promise<Tournament> {
    try {
      console.log(
        `👤 Unregistering player ${userId} from tournament ${tournamentId}...`
      );
      const tournament = await apiService.unregisterFromTournament(
        tournamentId,
        userId
      );
      console.log(
        `✅ Player unregistered successfully from tournament: ${tournament.name}`
      );
      return tournament;
    } catch (error) {
      console.error(
        `❌ Failed to unregister player from tournament ${tournamentId}:`,
        error
      );
      throw new Error(
        'Failed to unregister from tournament. Please try again later.'
      );
    }
  }

  /**
   * Start a tournament
   */
  async startTournament(tournamentId: string): Promise<Tournament> {
    try {
      console.log(`🏆 Starting tournament ${tournamentId}...`);
      const tournament = await apiService.startTournament(tournamentId);
      console.log(`✅ Tournament started successfully: ${tournament.name}`);
      return tournament;
    } catch (error) {
      console.error(`❌ Failed to start tournament ${tournamentId}:`, error);
      throw new Error('Failed to start tournament. Please try again later.');
    }
  }

  /**
   * Get all matches for a tournament
   */
  async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    try {
      console.log(`🎯 Fetching matches for tournament ${tournamentId}...`);
      const matches = await apiService.getTournamentMatches(tournamentId);
      console.log(
        `✅ Retrieved ${matches.length} matches for tournament ${tournamentId}`
      );
      return matches;
    } catch (error) {
      console.error(
        `❌ Failed to fetch matches for tournament ${tournamentId}:`,
        error
      );
      throw new Error(
        'Failed to fetch tournament matches. Please try again later.'
      );
    }
  }

  /**
   * Get a specific match by ID
   */
  async getMatch(matchId: string): Promise<Match> {
    try {
      console.log(`🎯 Fetching match ${matchId}...`);
      const match = await apiService.getMatch(matchId);
      console.log(`✅ Retrieved match ${matchId}`);
      return match;
    } catch (error) {
      console.error(`❌ Failed to fetch match ${matchId}:`, error);
      throw new Error('Failed to fetch match. Please try again later.');
    }
  }

  /**
   * Update match results
   */
  async updateMatchResult(
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerId: string
  ): Promise<Match> {
    try {
      console.log(`🎯 Updating match ${matchId} results...`, {
        scoreA,
        scoreB,
        winnerId,
      });
      const match = await apiService.updateMatch(matchId, {
        scoreA,
        scoreB,
        winnerId,
      });
      console.log(`✅ Match ${matchId} updated successfully`);
      return match;
    } catch (error) {
      console.error(`❌ Failed to update match ${matchId}:`, error);
      throw new Error(
        'Failed to update match results. Please try again later.'
      );
    }
  }

  /**
   * Get tournament participants
   */
  async getTournamentParticipants(
    tournamentId: string
  ): Promise<TournamentParticipant[]> {
    try {
      console.log(`👥 Fetching participants for tournament ${tournamentId}...`);
      const tournament = await this.getTournamentById(tournamentId);
      console.log(
        `✅ Retrieved ${tournament.participants.length} participants for tournament ${tournamentId}`
      );
      return tournament.participants;
    } catch (error) {
      console.error(
        `❌ Failed to fetch participants for tournament ${tournamentId}:`,
        error
      );
      throw new Error(
        'Failed to fetch tournament participants. Please try again later.'
      );
    }
  }

  /**
   * Check if a user is registered for a tournament
   */
  async isUserRegisteredForTournament(
    tournamentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const participants = await this.getTournamentParticipants(tournamentId);
      return participants.some((participant) => participant.userId === userId);
    } catch (error) {
      console.error(
        `❌ Failed to check registration status for tournament ${tournamentId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get tournaments by status
   */
  async getTournamentsByStatus(
    status: Tournament['status']
  ): Promise<Tournament[]> {
    try {
      const allTournaments = await this.getAvailableTournaments();
      return allTournaments.filter(
        (tournament) => tournament.status === status
      );
    } catch (error) {
      console.error(
        `❌ Failed to filter tournaments by status ${status}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get tournaments by venue
   */
  async getTournamentsByVenue(venueId: string): Promise<Tournament[]> {
    try {
      const allTournaments = await this.getAvailableTournaments();
      return allTournaments.filter(
        (tournament) => tournament.venueId === venueId
      );
    } catch (error) {
      console.error(
        `❌ Failed to filter tournaments by venue ${venueId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Health check for the API service
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await apiService.healthCheck();
    } catch (error) {
      console.error('❌ API health check failed:', error);
      return false;
    }
  }
}

export default new TournamentService();
