import { Injectable, Logger } from '@nestjs/common';
import {
  CacheInvalidate,
  CacheKey,
  CacheWriteThrough,
  Cacheable,
} from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';

export interface Tournament {
  id: string;
  name: string;
  status: 'upcoming' | 'active' | 'completed';
  participants: number;
  maxParticipants: number;
  startDate: Date;
  endDate: Date;
  venueId: string;
  prizePool: number;
}

export interface TournamentListParams {
  status?: string;
  venueId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(private readonly cacheHelper: CacheHelper) {}

  /**
   * Read-heavy endpoint with caching
   */
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'tournaments:list',
    keyGenerator: (params: TournamentListParams) =>
      CacheKey('tournaments', 'list', JSON.stringify(params)),
    condition: (params: TournamentListParams) =>
      !params.page || params.page <= 3, // Only cache first 3 pages
  })
  async getTournaments(
    params: TournamentListParams = {}
  ): Promise<Tournament[]> {
    this.logger.debug('Fetching tournaments from database');

    // Simulate database query
    const tournaments: Tournament[] = [
      {
        id: '1',
        name: 'Brisbane Championship',
        status: 'upcoming',
        participants: 24,
        maxParticipants: 32,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-03'),
        venueId: 'venue1',
        prizePool: 5000,
      },
      {
        id: '2',
        name: 'Gold Coast Open',
        status: 'active',
        participants: 16,
        maxParticipants: 16,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-17'),
        venueId: 'venue2',
        prizePool: 3000,
      },
    ];

    return tournaments.filter((tournament) => {
      if (params.status && tournament.status !== params.status) return false;
      if (params.venueId && tournament.venueId !== params.venueId) return false;
      return true;
    });
  }

  /**
   * Single tournament with caching
   */
  @Cacheable({
    ttl: 600, // 10 minutes
    keyPrefix: 'tournaments:detail',
    keyGenerator: (tournamentId: string) =>
      CacheKey('tournaments', 'detail', tournamentId),
  })
  async getTournamentById(tournamentId: string): Promise<Tournament | null> {
    this.logger.debug(`Fetching tournament ${tournamentId} from database`);

    // Simulate database query
    const tournament: Tournament = {
      id: tournamentId,
      name: 'Brisbane Championship',
      status: 'upcoming',
      participants: 24,
      maxParticipants: 32,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-03'),
      venueId: 'venue1',
      prizePool: 5000,
    };

    return tournament;
  }

  /**
   * Write operation with write-through caching
   */
  @CacheWriteThrough({
    ttl: 600,
    keyPrefix: 'tournaments:detail',
    keyGenerator: (tournament: Tournament) =>
      CacheKey('tournaments', 'detail', tournament.id),
    invalidatePatterns: ['tournaments:list:*'],
  })
  async createTournament(
    tournament: Omit<Tournament, 'id'>
  ): Promise<Tournament> {
    this.logger.debug('Creating tournament in database');

    // Simulate database insert
    const newTournament: Tournament = {
      ...tournament,
      id: `tournament_${Date.now()}`,
    };

    return newTournament;
  }

  /**
   * Update operation with cache invalidation
   */
  @CacheInvalidate(['tournaments:list:*', 'tournaments:detail:*'])
  async updateTournament(
    tournamentId: string,
    updates: Partial<Tournament>
  ): Promise<Tournament> {
    this.logger.debug(`Updating tournament ${tournamentId} in database`);

    // Simulate database update
    const updatedTournament: Tournament = {
      id: tournamentId,
      name: updates.name || 'Updated Tournament',
      status: updates.status || 'upcoming',
      participants: updates.participants || 0,
      maxParticipants: updates.maxParticipants || 32,
      startDate: updates.startDate || new Date(),
      endDate: updates.endDate || new Date(),
      venueId: updates.venueId || 'venue1',
      prizePool: updates.prizePool || 0,
    };

    return updatedTournament;
  }

  /**
   * Delete operation with cache invalidation
   */
  @CacheInvalidate(['tournaments:list:*', 'tournaments:detail:*'])
  async deleteTournament(tournamentId: string): Promise<boolean> {
    this.logger.debug(`Deleting tournament ${tournamentId} from database`);

    // Simulate database delete
    return true;
  }

  /**
   * Venue-specific tournaments with caching
   */
  @Cacheable({
    ttl: 300,
    keyPrefix: 'tournaments:venue',
    keyGenerator: (venueId: string) =>
      CacheKey('tournaments', 'venue', venueId),
  })
  async getTournamentsByVenue(venueId: string): Promise<Tournament[]> {
    this.logger.debug(
      `Fetching tournaments for venue ${venueId} from database`
    );

    // Simulate database query
    const tournaments: Tournament[] = [
      {
        id: '1',
        name: 'Venue Championship',
        status: 'upcoming',
        participants: 16,
        maxParticipants: 24,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-03'),
        venueId,
        prizePool: 2000,
      },
    ];

    return tournaments;
  }

  /**
   * Batch operations using cache helper
   */
  async getMultipleTournaments(
    tournamentIds: string[]
  ): Promise<Map<string, Tournament>> {
    // Generate cache keys
    const cacheKeys = tournamentIds.map((id) =>
      CacheKey('tournaments', 'detail', id)
    );

    // Try batch get from cache
    const cachedResults = await this.cacheHelper.batchGet<Tournament>(
      cacheKeys,
      'tournaments:detail'
    );

    // Find missing tournaments
    const missingIds = tournamentIds.filter((id) => {
      const key = CacheKey('tournaments', 'detail', id);
      return !cachedResults.has(key);
    });

    if (missingIds.length === 0) {
      this.logger.debug('All tournaments found in cache');
      return cachedResults;
    }

    // Fetch missing tournaments from database
    this.logger.debug(
      `Fetching ${missingIds.length} tournaments from database`
    );
    const fetchedTournaments = await Promise.all(
      missingIds.map((id) => this.getTournamentById(id))
    );

    // Cache the fetched tournaments
    const cacheEntries = fetchedTournaments
      .filter((t) => t !== null)
      .map((tournament) => ({
        key: CacheKey('tournaments', 'detail', tournament!.id),
        data: tournament!,
        options: { ttl: 600, keyPrefix: 'tournaments:detail' },
      }));

    if (cacheEntries.length > 0) {
      await this.cacheHelper.batchSet(cacheEntries);
    }

    // Combine cached and fetched results
    const allResults = new Map<string, Tournament>();

    // Add cached results
    cachedResults.forEach((tournament, key) => {
      const id = key.split(':').pop()!;
      allResults.set(id, tournament);
    });

    // Add fetched results
    fetchedTournaments.forEach((tournament) => {
      if (tournament) {
        allResults.set(tournament.id, tournament);
      }
    });

    return allResults;
  }

  /**
   * Health check for cache
   */
  async healthCheck(): Promise<boolean> {
    return await this.cacheHelper.healthCheck();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await this.cacheHelper.getStats();
  }

  // Additional methods required by controller
  async findAllTournaments(): Promise<Tournament[]> {
    return this.getTournaments();
  }

  async findOneTournament(id: string): Promise<Tournament | null> {
    return this.getTournamentById(id);
  }

  async findTournamentMatches(id: string): Promise<any[]> {
    // Tournament matches implementation - placeholder
    this.logger.debug(`Fetching matches for tournament ${id}`);
    return [];
  }

  async removeTournament(id: string): Promise<boolean> {
    return this.deleteTournament(id);
  }

  async registerPlayer(tournamentId: string, registerDto: any): Promise<any> {
    // Player registration implementation - placeholder
    this.logger.debug(`Registering player for tournament ${tournamentId}`);
    return { success: true };
  }

  async unregisterPlayer(
    tournamentId: string,
    unregisterDto: any
  ): Promise<any> {
    // Player unregistration implementation - placeholder
    this.logger.debug(`Unregistering player from tournament ${tournamentId}`);
    return { success: true };
  }

  async startTournament(id: string): Promise<any> {
    // Tournament start implementation - placeholder
    this.logger.debug(`Starting tournament ${id}`);
    return { success: true };
  }

  async updateMatch(matchId: string, updateMatchDto: any): Promise<any> {
    // Match update implementation - placeholder
    this.logger.debug(`Updating match ${matchId}`);
    return { success: true };
  }

  async getMatchById(matchId: string): Promise<any> {
    // Match retrieval implementation - placeholder
    this.logger.debug(`Getting match ${matchId}`);
    return { id: matchId, status: 'pending' };
  }

  async create(
    createTournamentDto: any,
    venueId?: string
  ): Promise<Tournament> {
    return this.createTournament(createTournamentDto);
  }

  async findTournamentsByVenue(venueId: string): Promise<Tournament[]> {
    return this.getTournamentsByVenue(venueId);
  }
}
