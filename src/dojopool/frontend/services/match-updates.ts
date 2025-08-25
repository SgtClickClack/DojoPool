export interface LiveMatchPlayer {
  name: string;
  avatar: string;
}

export interface LiveMatchScore {
  player1: number;
  player2: number;
}

export interface LiveMatch {
  id: string;
  player1: LiveMatchPlayer;
  player2: LiveMatchPlayer;
  currentScore: LiveMatchScore;
  spectatorCount: number;
  status: 'in_progress' | 'paused' | 'finished';
  lastUpdate: number;
}

type MatchListener = (match: LiveMatch) => void;

class MatchUpdateServiceStub {
  private listeners: Map<string, Set<MatchListener>> = new Map();

  startWatchingMatch(_matchId: string) {
    // no-op
  }

  stopWatchingMatch(_matchId: string) {
    // no-op
  }

  subscribeToMatch(matchId: string, listener: MatchListener) {
    if (!this.listeners.has(matchId)) {
      this.listeners.set(matchId, new Set());
    }
    this.listeners.get(matchId)!.add(listener);
    return () => {
      this.listeners.get(matchId)?.delete(listener);
    };
  }
}

const matchUpdateService = new MatchUpdateServiceStub();
export default matchUpdateService;
export type { LiveMatch };


