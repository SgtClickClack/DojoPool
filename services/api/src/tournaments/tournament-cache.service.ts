import { Injectable, Logger } from '@nestjs/common';
import { CacheHelper } from '../cache/cache.helper';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class TournamentCacheService {
  private readonly logger = new Logger(TournamentCacheService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly cacheHelper: CacheHelper
  ) {}

  /**
   * Generate cache key for tournament list
   */
  static generateTournamentListKey(filters: {
    status?: string;
    venueId?: string;
    page?: number;
    limit?: number;
  }): string {
    const { status, venueId, page = 1, limit = 20 } = filters;
    return `tournaments:list:${status || 'all'}:${venueId || 'all'}:${page}:${limit}`;
  }

  /**
   * Generate cache key for tournament detail
   */
  static generateTournamentDetailKey(tournamentId: string): string {
    return `tournaments:detail:${tournamentId}`;
  }

  /**
   * Generate cache key for tournament bracket
   */
  static generateTournamentBracketKey(tournamentId: string): string {
    return `tournaments:bracket:${tournamentId}`;
  }

  /**
   * Generate cache key for user tournament history
   */
  static generateUserHistoryKey(
    userId: string,
    page: number,
    limit: number
  ): string {
    return `tournaments:user:history:${userId}:${page}:${limit}`;
  }

  /**
   * Generate cache key for matchmaking statistics
   */
  static generateMatchmakingStatsKey(): string {
    return 'matchmaking:stats:global';
  }

  /**
   * Cache tournament list with intelligent invalidation
   */
  async cacheTournamentList(
    filters: {
      status?: string;
      venueId?: string;
      page?: number;
      limit?: number;
    },
    data: any,
    ttl = 300 // 5 minutes
  ): Promise<void> {
    const key = TournamentCacheService.generateTournamentListKey(filters);
    await this.cacheService.set(key, data, { ttl });
  }

  /**
   * Get cached tournament list
   */
  async getCachedTournamentList(filters: {
    status?: string;
    venueId?: string;
    page?: number;
    limit?: number;
  }): Promise<any | null> {
    const key = TournamentCacheService.generateTournamentListKey(filters);
    return this.cacheService.get(key);
  }

  /**
   * Cache tournament detail
   */
  async cacheTournamentDetail(
    tournamentId: string,
    data: any,
    ttl = 600
  ): Promise<void> {
    const key =
      TournamentCacheService.generateTournamentDetailKey(tournamentId);
    await this.cacheService.set(key, data, { ttl });
  }

  /**
   * Get cached tournament detail
   */
  async getCachedTournamentDetail(tournamentId: string): Promise<any | null> {
    const key =
      TournamentCacheService.generateTournamentDetailKey(tournamentId);
    return this.cacheService.get(key);
  }

  /**
   * Cache tournament bracket
   */
  async cacheTournamentBracket(
    tournamentId: string,
    data: any,
    ttl = 180
  ): Promise<void> {
    const key =
      TournamentCacheService.generateTournamentBracketKey(tournamentId);
    await this.cacheService.set(key, data, { ttl });
  }

  /**
   * Get cached tournament bracket
   */
  async getCachedTournamentBracket(tournamentId: string): Promise<any | null> {
    const key =
      TournamentCacheService.generateTournamentBracketKey(tournamentId);
    return this.cacheService.get(key);
  }

  /**
   * Cache user tournament history
   */
  async cacheUserTournamentHistory(
    userId: string,
    page: number,
    limit: number,
    data: any,
    ttl = 600
  ): Promise<void> {
    const key = TournamentCacheService.generateUserHistoryKey(
      userId,
      page,
      limit
    );
    await this.cacheService.set(key, data, { ttl });
  }

  /**
   * Get cached user tournament history
   */
  async getCachedUserTournamentHistory(
    userId: string,
    page: number,
    limit: number
  ): Promise<any | null> {
    const key = TournamentCacheService.generateUserHistoryKey(
      userId,
      page,
      limit
    );
    return this.cacheService.get(key);
  }

  /**
   * Cache matchmaking statistics
   */
  async cacheMatchmakingStats(data: any, ttl = 60): Promise<void> {
    const key = TournamentCacheService.generateMatchmakingStatsKey();
    await this.cacheService.set(key, data, { ttl });
  }

  /**
   * Get cached matchmaking statistics
   */
  async getCachedMatchmakingStats(): Promise<any | null> {
    const key = TournamentCacheService.generateMatchmakingStatsKey();
    return this.cacheService.get(key);
  }

  /**
   * Invalidate all tournament-related cache
   */
  async invalidateAllTournamentCache(): Promise<void> {
    const patterns = [
      'tournaments:list:*',
      'tournaments:detail:*',
      'tournaments:bracket:*',
      'tournaments:user:history:*',
    ];

    await this.cacheHelper.invalidatePatterns(patterns);
    this.logger.log('Invalidated all tournament cache');
  }

  /**
   * Invalidate tournament list cache
   */
  async invalidateTournamentListCache(): Promise<void> {
    await this.cacheService.deleteByPattern('tournaments:list:*');
    this.logger.log('Invalidated tournament list cache');
  }

  /**
   * Invalidate specific tournament cache
   */
  async invalidateTournamentCache(tournamentId: string): Promise<void> {
    const keys = [
      TournamentCacheService.generateTournamentDetailKey(tournamentId),
      TournamentCacheService.generateTournamentBracketKey(tournamentId),
    ];

    for (const key of keys) {
      await this.cacheService.delete(key);
    }

    this.logger.log(`Invalidated cache for tournament ${tournamentId}`);
  }

  /**
   * Invalidate user tournament history cache
   */
  async invalidateUserTournamentHistoryCache(userId: string): Promise<void> {
    const pattern = `tournaments:user:history:${userId}:*`;
    await this.cacheService.deleteByPattern(pattern);
    this.logger.log(`Invalidated tournament history cache for user ${userId}`);
  }

  /**
   * Invalidate matchmaking cache
   */
  async invalidateMatchmakingCache(): Promise<void> {
    await this.cacheService.deleteByPattern('matchmaking:*');
    this.logger.log('Invalidated matchmaking cache');
  }

  /**
   * Warm up tournament cache (pre-populate frequently accessed data)
   */
  async warmUpTournamentCache(): Promise<void> {
    try {
      // This would typically be called during application startup
      // or by a scheduled job to pre-populate cache

      this.logger.log('Tournament cache warm-up completed');
    } catch (error) {
      this.logger.error('Failed to warm up tournament cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    tournamentLists: number;
    tournamentDetails: number;
    tournamentBrackets: number;
    userHistories: number;
    matchmakingStats: number;
    total: number;
  }> {
    try {
      const stats = await this.cacheService.getStats();

      // For Redis, we'd need to count keys with patterns
      // This is a simplified version
      return {
        tournamentLists: 0, // Would need Redis SCAN or KEYS
        tournamentDetails: 0,
        tournamentBrackets: 0,
        userHistories: 0,
        matchmakingStats: 0,
        total: stats.keys,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        tournamentLists: 0,
        tournamentDetails: 0,
        tournamentBrackets: 0,
        userHistories: 0,
        matchmakingStats: 0,
        total: 0,
      };
    }
  }

  /**
   * Health check for tournament cache
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic cache operations
      const testKey = 'health:test';
      const testData = { timestamp: Date.now() };

      await this.cacheService.set(testKey, testData, { ttl: 10 });
      const retrieved = await this.cacheService.get(testKey);
      await this.cacheService.delete(testKey);

      return retrieved !== null;
    } catch (error) {
      this.logger.error('Tournament cache health check failed:', error);
      return false;
    }
  }
}
