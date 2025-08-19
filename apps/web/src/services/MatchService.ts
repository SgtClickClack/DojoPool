export interface Match {
  id: string;
  tournamentId?: string;
  venueId: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  tableNumber: number;
  gameType: '8ball' | '9ball' | '10ball' | 'straight_pool';
  bestOf: number;
  currentGame: number;
  winnerId?: string;
  rules: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchUpdate {
  matchId: string;
  player1Score?: number;
  player2Score?: number;
  status?: string;
  currentGame?: number;
  winnerId?: string;
  endTime?: Date;
}

export interface MatchFilters {
  venueId?: string;
  tournamentId?: string;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  playerId?: string;
  tableNumber?: number;
  startDate?: Date;
  endDate?: Date;
}

class MatchService {
  private static instance: MatchService;
  private matchListeners: Map<string, Set<(matches: Match[]) => void>> =
    new Map();
  private matchCache: Map<string, Match[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for matches

  private constructor() {
    this.initializeRealTimeUpdates();
  }

  public static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  /**
   * Get matches with optional filtering
   */
  async getMatches(filters?: MatchFilters): Promise<Match[]> {
    const cacheKey = `matches_${JSON.stringify(filters || {})}`;

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.matchCache.get(cacheKey) || [];
    }

    try {
      // Fetch from backend API
      const matches = await this.fetchMatchesFromAPI(filters);

      // Cache the results
      this.matchCache.set(cacheKey, matches);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      // Return cached data if available, even if expired
      return this.matchCache.get(cacheKey) || [];
    }
  }

  /**
   * Get matches for a specific venue
   */
  async getVenueMatches(
    venueId: string,
    filters?: MatchFilters
  ): Promise<Match[]> {
    const venueFilters: MatchFilters = {
      ...filters,
      venueId,
    };

    return this.getMatches(venueFilters);
  }

  /**
   * Get live matches for a venue
   */
  async getLiveMatches(venueId: string): Promise<Match[]> {
    const filters: MatchFilters = {
      venueId,
      status: 'live',
    };

    return this.getMatches(filters);
  }

  /**
   * Get scheduled matches for a venue
   */
  async getScheduledMatches(venueId: string): Promise<Match[]> {
    const filters: MatchFilters = {
      venueId,
      status: 'scheduled',
    };

    return this.getMatches(filters);
  }

  /**
   * Get completed matches for a venue
   */
  async getCompletedMatches(venueId: string): Promise<Match[]> {
    const filters: MatchFilters = {
      venueId,
      status: 'completed',
    };

    return this.getMatches(filters);
  }

  /**
   * Get a specific match by ID
   */
  async getMatch(matchId: string): Promise<Match | null> {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching match:', error);
      return null;
    }
  }

  /**
   * Create a new match
   */
  async createMatch(
    matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Match> {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newMatch = await response.json();

      // Invalidate cache and notify listeners
      this.invalidateMatchCache(newMatch.venueId);
      this.notifyMatchListeners(newMatch.venueId, []);

      return newMatch;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  /**
   * Update match score or status
   */
  async updateMatch(matchId: string, updates: MatchUpdate): Promise<Match> {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedMatch = await response.json();

      // Invalidate cache and notify listeners
      this.invalidateMatchCache(updatedMatch.venueId);
      this.notifyMatchListeners(updatedMatch.venueId, []);

      return updatedMatch;
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  }

  /**
   * Start a match
   */
  async startMatch(matchId: string): Promise<Match> {
    return this.updateMatch(matchId, {
      matchId,
      status: 'live',
      startTime: new Date(),
    });
  }

  /**
   * End a match
   */
  async endMatch(
    matchId: string,
    winnerId: string,
    finalScore: { player1Score: number; player2Score: number }
  ): Promise<Match> {
    return this.updateMatch(matchId, {
      matchId,
      status: 'completed',
      winnerId,
      player1Score: finalScore.player1Score,
      player2Score: finalScore.player2Score,
      endTime: new Date(),
    });
  }

  /**
   * Update match score
   */
  async updateScore(
    matchId: string,
    player1Score: number,
    player2Score: number
  ): Promise<Match> {
    return this.updateMatch(matchId, {
      matchId,
      player1Score,
      player2Score,
    });
  }

  /**
   * Subscribe to real-time match updates
   */
  subscribeToMatches(
    callback: (matches: Match[]) => void,
    venueId?: string
  ): () => void {
    const key = venueId || 'global';

    if (!this.matchListeners.has(key)) {
      this.matchListeners.set(key, new Set());
    }

    this.matchListeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.matchListeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.matchListeners.delete(key);
        }
      }
    };
  }

  /**
   * Get match statistics
   */
  async getMatchStats(matchId: string): Promise<any> {
    try {
      const response = await fetch(`/api/matches/${matchId}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching match stats:', error);
      return null;
    }
  }

  /**
   * Get player match history
   */
  async getPlayerMatchHistory(
    playerId: string,
    filters?: MatchFilters
  ): Promise<Match[]> {
    const playerFilters: MatchFilters = {
      ...filters,
      playerId,
    };

    return this.getMatches(playerFilters);
  }

  // Private methods

  private async fetchMatchesFromAPI(filters?: MatchFilters): Promise<Match[]> {
    try {
      const queryParams = new URLSearchParams();

      if (filters?.venueId) queryParams.append('venueId', filters.venueId);
      if (filters?.tournamentId)
        queryParams.append('tournamentId', filters.tournamentId);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.playerId) queryParams.append('playerId', filters.playerId);
      if (filters?.tableNumber)
        queryParams.append('tableNumber', filters.tableNumber.toString());
      if (filters?.startDate)
        queryParams.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate)
        queryParams.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/matches?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching matches from API:', error);
      // Return sample data for development
      return this.generateSampleMatches(filters);
    }
  }

  private generateSampleMatches(filters?: MatchFilters): Match[] {
    const now = new Date();
    const venueId = filters?.venueId || 'sample-venue';

    return [
      {
        id: 'match_1',
        venueId,
        player1Id: 'player_1',
        player2Id: 'player_2',
        player1Name: 'Alex Chen',
        player2Name: 'Sarah Johnson',
        player1Score: 3,
        player2Score: 2,
        status: 'live',
        startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        tableNumber: 1,
        gameType: '8ball',
        bestOf: 7,
        currentGame: 6,
        rules: 'Standard 8-ball rules',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'match_2',
        venueId,
        player1Id: 'player_3',
        player2Id: 'player_4',
        player1Name: 'Mike Rodriguez',
        player2Name: 'Emma Thompson',
        player1Score: 0,
        player2Score: 0,
        status: 'scheduled',
        startTime: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes from now
        tableNumber: 2,
        gameType: '9ball',
        bestOf: 5,
        currentGame: 1,
        rules: 'Standard 9-ball rules',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'match_3',
        venueId,
        player1Id: 'player_5',
        player2Id: 'player_6',
        player1Name: 'David Kim',
        player2Name: 'Lisa Wang',
        player1Score: 4,
        player2Score: 2,
        status: 'completed',
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(now.getTime() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        tableNumber: 3,
        gameType: '8ball',
        bestOf: 7,
        currentGame: 6,
        winnerId: 'player_5',
        rules: 'Standard 8-ball rules',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  private invalidateMatchCache(venueId: string): void {
    // Invalidate all cache keys that might contain matches for this venue
    for (const [key] of this.matchCache.entries()) {
      if (key.includes('matches') && key.includes(venueId)) {
        this.matchCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  private notifyMatchListeners(venueId: string, matches: Match[]): void {
    const key = venueId || 'global';
    const listeners = this.matchListeners.get(key);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(matches);
        } catch (error) {
          console.error('Error in match listener callback:', error);
        }
      });
    }
  }

  private initializeRealTimeUpdates(): void {
    // Set up WebSocket connection or polling for real-time updates
    setInterval(() => {
      // Poll for updates every 15 seconds for matches (more frequent than tournaments)
      this.pollForUpdates();
    }, 15000);
  }

  private async pollForUpdates(): Promise<void> {
    // This would check for updates from the backend
    // For now, just refresh cache expiry
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.matchCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }
}

export default MatchService;
