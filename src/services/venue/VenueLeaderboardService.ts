import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

export interface VenuePerformance {
  venueId: string;
  venueName: string;
  totalMatches: number;
  totalTournaments: number;
  totalPlayers: number;
  averageRating: number;
  revenue: number;
  activityScore: number;
  lastUpdated: Date;
}

export interface PlayerPerformance {
  playerId: string;
  playerName: string;
  venueId: string;
  matchesWon: number;
  matchesPlayed: number;
  tournamentsWon: number;
  tournamentsPlayed: number;
  winRate: number;
  totalEarnings: number;
  rating: number;
  lastActive: Date;
}

export interface DojoMaster {
  venueId: string;
  venueName: string;
  masterId: string;
  masterName: string;
  designationDate: Date;
  achievements: string[];
  privileges: string[];
  reignDuration: number; // days
  totalDefenses: number;
  successfulDefenses: number;
}

export interface LeaderboardEntry {
  rank: number;
  venueId: string;
  venueName: string;
  performance: VenuePerformance;
  dojoMaster?: DojoMaster;
  topPlayers: PlayerPerformance[];
  weeklyChange: number;
  monthlyChange: number;
}

export interface LeaderboardConfig {
  updateInterval: number; // minutes
  rankingFactors: {
    matches: number;
    tournaments: number;
    players: number;
    revenue: number;
    rating: number;
  };
  dojoMasterRequirements: {
    minMatches: number;
    minWinRate: number;
    minRating: number;
    minActivityDays: number;
  };
}

export class VenueLeaderboardService extends EventEmitter {
  private socket: Socket | null = null;
  private venues: Map<string, VenuePerformance> = new Map();
  private players: Map<string, PlayerPerformance> = new Map();
  private dojoMasters: Map<string, DojoMaster> = new Map();
  private leaderboard: LeaderboardEntry[] = [];
  private config: LeaderboardConfig;
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config?: Partial<LeaderboardConfig>) {
    super();
    this.config = {
      updateInterval: 30, // 30 minutes
      rankingFactors: {
        matches: 0.3,
        tournaments: 0.25,
        players: 0.2,
        revenue: 0.15,
        rating: 0.1
      },
      dojoMasterRequirements: {
        minMatches: 50,
        minWinRate: 0.7,
        minRating: 1500,
        minActivityDays: 7
      },
      ...config
    };
    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.socket = io('/socket.io');
    
    this.socket.on('connect', () => {
      console.log('VenueLeaderboardService connected to server');
      this.startLeaderboardUpdates();
    });

    this.socket.on('disconnect', () => {
      console.log('VenueLeaderboardService disconnected from server');
      this.stopLeaderboardUpdates();
    });

    this.socket.on('venue-activity-update', (data: any) => {
      this.updateVenuePerformance(data.venueId, data.activity);
    });

    this.socket.on('match-result', (data: any) => {
      this.handleMatchResult(data);
    });

    this.socket.on('tournament-complete', (data: any) => {
      this.handleTournamentComplete(data);
    });
  }

  /**
   * Start automatic leaderboard updates
   */
  public startLeaderboardUpdates(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.updateLeaderboard();
    }, this.config.updateInterval * 60 * 1000);

    // Initial update
    this.updateLeaderboard();

    console.log('Venue leaderboard update system started');
  }

  /**
   * Stop automatic leaderboard updates
   */
  public stopLeaderboardUpdates(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('Venue leaderboard update system stopped');
  }

  /**
   * Update venue performance data
   */
  public updateVenuePerformance(venueId: string, activity: any): void {
    const venue = this.venues.get(venueId);
    if (!venue) {
      // Create new venue performance entry
      const newVenue: VenuePerformance = {
        venueId,
        venueName: activity.venueName || `Venue ${venueId}`,
        totalMatches: activity.matches || 0,
        totalTournaments: activity.tournaments || 0,
        totalPlayers: activity.players || 0,
        averageRating: activity.averageRating || 1000,
        revenue: activity.revenue || 0,
        activityScore: this.calculateActivityScore(activity),
        lastUpdated: new Date()
      };
      this.venues.set(venueId, newVenue);
    } else {
      // Update existing venue
      venue.totalMatches = activity.matches || venue.totalMatches;
      venue.totalTournaments = activity.tournaments || venue.totalTournaments;
      venue.totalPlayers = activity.players || venue.totalPlayers;
      venue.averageRating = activity.averageRating || venue.averageRating;
      venue.revenue = activity.revenue || venue.revenue;
      venue.activityScore = this.calculateActivityScore(activity);
      venue.lastUpdated = new Date();
    }

    this.socket?.emit('venue-leaderboard:performance-updated', {
      venueId,
      performance: this.venues.get(venueId)
    });
  }

  /**
   * Update player performance data
   */
  public updatePlayerPerformance(playerId: string, venueId: string, performance: any): void {
    const key = `${playerId}-${venueId}`;
    const player = this.players.get(key);
    
    if (!player) {
      // Create new player performance entry
      const newPlayer: PlayerPerformance = {
        playerId,
        playerName: performance.playerName || `Player ${playerId}`,
        venueId,
        matchesWon: performance.matchesWon || 0,
        matchesPlayed: performance.matchesPlayed || 0,
        tournamentsWon: performance.tournamentsWon || 0,
        tournamentsPlayed: performance.tournamentsPlayed || 0,
        winRate: performance.matchesPlayed > 0 ? performance.matchesWon / performance.matchesPlayed : 0,
        totalEarnings: performance.totalEarnings || 0,
        rating: performance.rating || 1000,
        lastActive: new Date()
      };
      this.players.set(key, newPlayer);
    } else {
      // Update existing player
      player.matchesWon = performance.matchesWon || player.matchesWon;
      player.matchesPlayed = performance.matchesPlayed || player.matchesPlayed;
      player.tournamentsWon = performance.tournamentsWon || player.tournamentsWon;
      player.tournamentsPlayed = performance.tournamentsPlayed || player.tournamentsPlayed;
      player.winRate = player.matchesPlayed > 0 ? player.matchesWon / player.matchesPlayed : 0;
      player.totalEarnings = performance.totalEarnings || player.totalEarnings;
      player.rating = performance.rating || player.rating;
      player.lastActive = new Date();
    }

    // Check if player qualifies for Dojo Master
    this.checkDojoMasterEligibility(playerId, venueId);
  }

  /**
   * Handle match result
   */
  private handleMatchResult(data: any): void {
    const { venueId, winnerId, loserId, winnerName, loserName } = data;
    
    // Update winner performance
    this.updatePlayerPerformance(winnerId, venueId, {
      playerName: winnerName,
      matchesWon: 1,
      matchesPlayed: 1
    });

    // Update loser performance
    this.updatePlayerPerformance(loserId, venueId, {
      playerName: loserName,
      matchesWon: 0,
      matchesPlayed: 1
    });

    // Update venue performance
    this.updateVenuePerformance(venueId, {
      matches: 1
    });
  }

  /**
   * Handle tournament completion
   */
  private handleTournamentComplete(data: any): void {
    const { venueId, winnerId, winnerName, participants } = data;
    
    // Update winner performance
    this.updatePlayerPerformance(winnerId, venueId, {
      playerName: winnerName,
      tournamentsWon: 1,
      tournamentsPlayed: 1
    });

    // Update venue performance
    this.updateVenuePerformance(venueId, {
      tournaments: 1,
      players: participants.length
    });
  }

  /**
   * Calculate activity score for a venue
   */
  private calculateActivityScore(activity: any): number {
    const playerScore = Math.min(activity.players / 20, 1) * 100;
    const matchScore = Math.min(activity.matches / 10, 1) * 100;
    const tournamentScore = Math.min(activity.tournaments / 5, 1) * 100;
    const revenueScore = Math.min(activity.revenue / 2000, 1) * 100;
    
    return (playerScore + matchScore + tournamentScore + revenueScore) / 4;
  }

  /**
   * Check if a player qualifies for Dojo Master
   */
  private checkDojoMasterEligibility(playerId: string, venueId: string): void {
    const key = `${playerId}-${venueId}`;
    const player = this.players.get(key);
    if (!player) return;

    const requirements = this.config.dojoMasterRequirements;
    const daysSinceActive = (Date.now() - player.lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (
      player.matchesPlayed >= requirements.minMatches &&
      player.winRate >= requirements.minWinRate &&
      player.rating >= requirements.minRating &&
      daysSinceActive <= requirements.minActivityDays
    ) {
      this.designateDojoMaster(venueId, playerId, player.playerName);
    }
  }

  /**
   * Designate a player as Dojo Master
   */
  public designateDojoMaster(venueId: string, playerId: string, playerName: string): void {
    const venue = this.venues.get(venueId);
    if (!venue) return;

    const currentMaster = this.dojoMasters.get(venueId);
    if (currentMaster && currentMaster.masterId === playerId) return;

    const dojoMaster: DojoMaster = {
      venueId,
      venueName: venue.venueName,
      masterId: playerId,
      masterName: playerName,
      designationDate: new Date(),
      achievements: ['Dojo Master Designation'],
      privileges: ['Venue Priority', 'Exclusive Tournaments', 'Master Badge'],
      reignDuration: 0,
      totalDefenses: 0,
      successfulDefenses: 0
    };

    this.dojoMasters.set(venueId, dojoMaster);

    this.socket?.emit('venue-leaderboard:dojo-master-designated', dojoMaster);
    this.emit('dojoMasterDesignated', dojoMaster);

    console.log(`Dojo Master designated: ${playerName} at ${venue.venueName}`);
  }

  /**
   * Update leaderboard rankings
   */
  private updateLeaderboard(): void {
    const entries: LeaderboardEntry[] = [];

    for (const [venueId, performance] of this.venues) {
      const venuePlayers = Array.from(this.players.values())
        .filter(p => p.venueId === venueId)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);

      const dojoMaster = this.dojoMasters.get(venueId);
      
      const entry: LeaderboardEntry = {
        rank: 0, // Will be set after sorting
        venueId,
        venueName: performance.venueName,
        performance,
        dojoMaster,
        topPlayers: venuePlayers,
        weeklyChange: 0, // TODO: Calculate weekly change
        monthlyChange: 0 // TODO: Calculate monthly change
      };

      entries.push(entry);
    }

    // Sort by performance score
    entries.sort((a, b) => {
      const scoreA = this.calculateVenueScore(a.performance);
      const scoreB = this.calculateVenueScore(b.performance);
      return scoreB - scoreA;
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.leaderboard = entries;

    this.socket?.emit('venue-leaderboard:updated', this.leaderboard);
    this.emit('leaderboardUpdated', this.leaderboard);
  }

  /**
   * Calculate venue score for ranking
   */
  private calculateVenueScore(performance: VenuePerformance): number {
    const { rankingFactors } = this.config;
    
    return (
      performance.totalMatches * rankingFactors.matches +
      performance.totalTournaments * rankingFactors.tournaments +
      performance.totalPlayers * rankingFactors.players +
      performance.revenue * rankingFactors.revenue +
      performance.averageRating * rankingFactors.rating
    );
  }

  /**
   * Get current leaderboard
   */
  public getLeaderboard(): LeaderboardEntry[] {
    return [...this.leaderboard];
  }

  /**
   * Get venue performance
   */
  public getVenuePerformance(venueId: string): VenuePerformance | null {
    return this.venues.get(venueId) || null;
  }

  /**
   * Get player performance
   */
  public getPlayerPerformance(playerId: string, venueId: string): PlayerPerformance | null {
    const key = `${playerId}-${venueId}`;
    return this.players.get(key) || null;
  }

  /**
   * Get Dojo Master for a venue
   */
  public getDojoMaster(venueId: string): DojoMaster | null {
    return this.dojoMasters.get(venueId) || null;
  }

  /**
   * Get all Dojo Masters
   */
  public getAllDojoMasters(): DojoMaster[] {
    return Array.from(this.dojoMasters.values());
  }

  /**
   * Get top players for a venue
   */
  public getTopPlayers(venueId: string, limit: number = 10): PlayerPerformance[] {
    return Array.from(this.players.values())
      .filter(p => p.venueId === venueId)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<LeaderboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart update system with new interval
    if (this.isRunning) {
      this.stopLeaderboardUpdates();
      this.startLeaderboardUpdates();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): LeaderboardConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const venueLeaderboardService = new VenueLeaderboardService(); 
