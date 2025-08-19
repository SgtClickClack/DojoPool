import wsService from './websocket';
import {
  type Match,
  type MatchUpdate,
  type MatchScore,
} from '../../types/match';

export interface LiveMatch extends Match {
  isLive: boolean;
  currentScore: MatchScore;
  spectatorCount: number;
  lastUpdate: string;
}

class MatchUpdateService {
  private activeMatches: Map<string, LiveMatch> = new Map();

  constructor() {
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    wsService.subscribe('match:update', (message) => {
      const update = message.payload as MatchUpdate;
      this.handleMatchUpdate(update);
    });

    wsService.subscribe('match:score', (message) => {
      const { matchId, score } = message.payload;
      this.handleScoreUpdate(matchId, score);
    });

    wsService.subscribe('match:spectators', (message) => {
      const { matchId, count } = message.payload;
      this.updateSpectatorCount(matchId, count);
    });
  }

  private handleMatchUpdate(update: MatchUpdate): void {
    const match = this.activeMatches.get(update.matchId);
    if (match) {
      this.activeMatches.set(update.matchId, {
        ...match,
        ...update,
        lastUpdate: new Date().toISOString(),
      });
      this.notifySubscribers('match:update', update.matchId);
    }
  }

  private handleScoreUpdate(matchId: string, score: MatchScore): void {
    const match = this.activeMatches.get(matchId);
    if (match) {
      this.activeMatches.set(matchId, {
        ...match,
        currentScore: score,
        lastUpdate: new Date().toISOString(),
      });
      this.notifySubscribers('match:score', matchId);
    }
  }

  private updateSpectatorCount(matchId: string, count: number): void {
    const match = this.activeMatches.get(matchId);
    if (match) {
      this.activeMatches.set(matchId, {
        ...match,
        spectatorCount: count,
        lastUpdate: new Date().toISOString(),
      });
      this.notifySubscribers('match:spectators', matchId);
    }
  }

  public subscribeToMatch(
    matchId: string,
    onUpdate: (match: LiveMatch) => void
  ): () => void {
    return wsService.subscribe(`match:${matchId}`, () => {
      const match = this.activeMatches.get(matchId);
      if (match) {
        onUpdate(match);
      }
    });
  }

  public startWatchingMatch(matchId: string): void {
    wsService.send('match:watch', {
      matchId,
      timestamp: new Date().toISOString(),
    });
  }

  public stopWatchingMatch(matchId: string): void {
    wsService.send('match:unwatch', {
      matchId,
      timestamp: new Date().toISOString(),
    });
    this.activeMatches.delete(matchId);
  }

  public updateScore(matchId: string, score: MatchScore): void {
    wsService.send('match:score-update', {
      matchId,
      score,
      timestamp: new Date().toISOString(),
    });
  }

  private notifySubscribers(type: string, matchId: string): void {
    const match = this.activeMatches.get(matchId);
    if (match) {
      wsService.emit(`match:${matchId}`, { match });
    }
  }
}

export const matchUpdateService = new MatchUpdateService();
export default matchUpdateService;
