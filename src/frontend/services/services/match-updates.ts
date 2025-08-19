export interface LiveMatch {
  id: string;
  player1: {
    id: string;
    name: string;
    score: number;
    avatar?: string;
  };
  player2: {
    id: string;
    name: string;
    score: number;
    avatar?: string;
  };
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'paused';
  gameType: string;
  venue: string;
  startTime: string;
  endTime?: string;
  currentTurn?: string;
  lastShot?: {
    player: string;
    ball: string;
    result: 'hit' | 'miss' | 'pocket';
    timestamp: string;
  };
  spectatorCount?: number;
  currentScore?: {
    player1: number;
    player2: number;
  };
  lastUpdate?: string;
}

class MatchUpdateService {
  private matches: Map<string, LiveMatch> = new Map();
  private listeners: Set<(match: LiveMatch) => void> = new Set();

  // Get a specific match
  getMatch(matchId: string): LiveMatch | undefined {
    return this.matches.get(matchId);
  }

  // Get all active matches
  getActiveMatches(): LiveMatch[] {
    return Array.from(this.matches.values()).filter(
      (match) => match.status === 'in_progress' || match.status === 'waiting'
    );
  }

  // Subscribe to match updates
  subscribeToMatch(
    matchId: string,
    listener: (match: LiveMatch) => void
  ): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Update match data
  updateMatch(matchId: string, updates: Partial<LiveMatch>): void {
    const existingMatch = this.matches.get(matchId);
    if (existingMatch) {
      const updatedMatch = { ...existingMatch, ...updates };
      this.matches.set(matchId, updatedMatch);

      // Notify listeners
      this.listeners.forEach((listener) => listener(updatedMatch));
    }
  }

  // Create a new match
  createMatch(matchData: Omit<LiveMatch, 'id'>): string {
    const matchId = `match-${Date.now()}`;
    const newMatch: LiveMatch = {
      ...matchData,
      id: matchId,
    };

    this.matches.set(matchId, newMatch);
    return matchId;
  }

  // End a match
  endMatch(matchId: string, winner: string): void {
    const match = this.matches.get(matchId);
    if (match) {
      const updatedMatch: LiveMatch = {
        ...match,
        status: 'completed',
        endTime: new Date().toISOString(),
      };

      this.matches.set(matchId, updatedMatch);
      this.listeners.forEach((listener) => listener(updatedMatch));
    }
  }

  // Record a shot
  recordShot(
    matchId: string,
    shotData: {
      player: string;
      ball: string;
      result: 'hit' | 'miss' | 'pocket';
    }
  ): void {
    const match = this.matches.get(matchId);
    if (match) {
      const lastShot = {
        ...shotData,
        timestamp: new Date().toISOString(),
      };

      const updatedMatch: LiveMatch = {
        ...match,
        lastShot,
        currentTurn: shotData.player,
      };

      this.matches.set(matchId, updatedMatch);
      this.listeners.forEach((listener) => listener(updatedMatch));
    }
  }

  // Update score
  updateScore(matchId: string, playerId: string, newScore: number): void {
    const match = this.matches.get(matchId);
    if (match) {
      const updatedMatch: LiveMatch = {
        ...match,
        player1:
          match.player1.id === playerId
            ? { ...match.player1, score: newScore }
            : match.player1,
        player2:
          match.player2.id === playerId
            ? { ...match.player2, score: newScore }
            : match.player2,
      };

      this.matches.set(matchId, updatedMatch);
      this.listeners.forEach((listener) => listener(updatedMatch));
    }
  }

  // Get match statistics
  getMatchStats(matchId: string): {
    totalShots: number;
    accuracy: number;
    duration: number;
  } | null {
    const match = this.matches.get(matchId);
    if (!match) return null;

    // This is a simplified version - in a real app, you'd track more detailed stats
    return {
      totalShots: 0, // TODO: Implement shot tracking
      accuracy: 0, // TODO: Implement accuracy calculation
      duration: match.endTime
        ? new Date(match.endTime).getTime() -
          new Date(match.startTime).getTime()
        : Date.now() - new Date(match.startTime).getTime(),
    };
  }

  // Start watching a match
  startWatchingMatch(matchId: string): void {
    // In a real implementation, this would establish a WebSocket connection
    // or start polling for updates
    console.log(`Started watching match: ${matchId}`);
  }

  // Stop watching a match
  stopWatchingMatch(matchId: string): void {
    // In a real implementation, this would close the WebSocket connection
    // or stop polling for updates
    console.log(`Stopped watching match: ${matchId}`);
  }
}

// Export singleton instance
export default new MatchUpdateService();
