import { Tournament, TournamentMatch as Match, TournamentParticipant as Participant, MatchStatus } from '';
import { AIRefereeService } from '';

export interface MatchUpdate {
  matchId: string;
  type: 'score' | 'status' | 'participant' | 'referee_decision' | 'commentary';
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface RealTimeMatchData {
  match: Match;
  currentPlayer?: Participant;
  shotHistory: ShotData[];
  refereeDecisions: RefereeDecision[];
  commentary: CommentaryEntry[];
  spectators: number;
  isLive: boolean;
}

export interface ShotData {
  id: string;
  playerId: string;
  timestamp: Date;
  ballPositions: BallPosition[];
  outcome: 'pocketed' | 'missed' | 'foul' | 'safety';
  score?: string;
}

export interface BallPosition {
  ballNumber: number;
  x: number;
  y: number;
  pocketed: boolean;
}

export interface RefereeDecision {
  id: string;
  type: 'foul' | 'no-foul' | 'warning' | 'info';
  category: string;
  description: string;
  explanation?: string;
  confidence: number;
  timestamp: Date;
  affectedPlayer?: string;
  severity: 'low' | 'medium' | 'high';
  videoTimestamp?: number;
  appealable: boolean;
  autoApplied: boolean;
}

export interface CommentaryEntry {
  id: string;
  type: 'shot' | 'foul' | 'turn' | 'game' | 'highlight';
  message: string;
  timestamp: Date;
  playerId?: string;
  matchId?: string;
}

export class RealTimeMatchService {
  private matches: Map<string, RealTimeMatchData> = new Map();
  private subscribers: Map<string, Set<(data: RealTimeMatchData) => void>> = new Map();
  private aiRefereeService: AIRefereeService;
  private updateInterval?: NodeJS.Timeout;

  constructor() {
    this.aiRefereeService = new AIRefereeService();
    this.startRealTimeUpdates();
  }

  /**
   * Initialize a match for real-time tracking
   */
  initializeMatch(match: Match): void {
    const matchData: RealTimeMatchData = {
      match,
      shotHistory: [],
      refereeDecisions: [],
      commentary: [],
      spectators: Math.floor(Math.random() * 50) + 10,
      isLive: match.status === 'in_progress',
    };

    this.matches.set(match.id, matchData);
    this.subscribers.set(match.id, new Set());
  }

  /**
   * Subscribe to real-time updates for a specific match
   */
  subscribeToMatch(matchId: string, callback: (data: RealTimeMatchData) => void): () => void {
    if (!this.subscribers.has(matchId)) {
      this.subscribers.set(matchId, new Set());
    }

    const subscribers = this.subscribers.get(matchId)!;
    subscribers.add(callback);

    // Send initial data
    const matchData = this.matches.get(matchId);
    if (matchData) {
      callback(matchData);
    }

    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(matchId);
      }
    };
  }

  /**
   * Record a shot in the match
   */
  async recordShot(matchId: string, shotData: Omit<ShotData, 'id' | 'timestamp'>): Promise<void> {
    const matchData = this.matches.get(matchId);
    if (!matchData) return;

    const shot: ShotData = {
      ...shotData,
      id: `shot_${Date.now()}`,
      timestamp: new Date(),
    };

    matchData.shotHistory.push(shot);
    matchData.currentPlayer = this.getNextPlayer(matchData.match, shotData.playerId);

    // Update match score if provided
    if (shotData.score) {
      // Update the appropriate player's score based on who took the shot
      if (shotData.playerId === matchData.match.player1Id?.toString()) {
        matchData.match.player1Score = parseInt(shotData.score);
      } else if (shotData.playerId === matchData.match.player2Id?.toString()) {
        matchData.match.player2Score = parseInt(shotData.score);
      }
    }

    // Analyze shot with AI referee
    await this.analyzeShotWithReferee(matchId, shot);

    // Add commentary
    this.addCommentary(matchId, {
      type: 'shot',
      message: this.generateShotCommentary(shot),
      playerId: shotData.playerId,
    });

    this.notifySubscribers(matchId);
  }

  /**
   * Analyze a shot with the AI referee
   */
  private async analyzeShotWithReferee(matchId: string, shot: ShotData): Promise<void> {
    const matchData = this.matches.get(matchId);
    if (!matchData) return;

    try {
      // Mock referee analysis for demo purposes
      // In a real implementation, this would call the actual AI referee service
      const mockRefereeResult = this.mockRefereeAnalysis(shot);

      if (mockRefereeResult.foul) {
        const decision: RefereeDecision = {
          id: `ref_${Date.now()}`,
          type: 'foul',
          category: mockRefereeResult.foul,
          description: `AI Referee detected ${mockRefereeResult.foul}`,
          explanation: mockRefereeResult.reason || 'Sky-T1 AI analysis completed with high confidence.',
          confidence: 0.9,
          timestamp: new Date(),
          affectedPlayer: shot.playerId,
          severity: 'medium',
          videoTimestamp: Date.now() - 5000,
          appealable: true,
          autoApplied: true,
        };

        matchData.refereeDecisions.push(decision);

        // Add foul commentary
        this.addCommentary(matchId, {
          type: 'foul',
          message: `Foul called! ${mockRefereeResult.reason}`,
          playerId: shot.playerId,
        });
      }
    } catch (error) {
      console.error('Error analyzing shot with AI referee:', error);
    }
  }

  /**
   * Mock referee analysis for demo purposes
   */
  private mockRefereeAnalysis(shot: ShotData): { foul: string | null; reason: string | null } {
    // Simulate different types of fouls based on shot outcome
    if (shot.outcome === 'foul') {
      const foulTypes = [
        'Ball in Hand Violation',
        'Double Tap',
        'Wrong Ball First',
        'Push Shot',
        'Ball Off Table',
      ];
      const foulType = foulTypes[Math.floor(Math.random() * foulTypes.length)];
      return {
        foul: foulType,
        reason: `AI detected ${foulType.toLowerCase()} during shot execution.`,
      };
    }

    // Occasionally detect fouls even on successful shots
    if (Math.random() > 0.95) {
      return {
        foul: 'Push Shot',
        reason: 'Cue stick contact duration exceeded legal limits.',
      };
    }

    return { foul: null, reason: null };
  }

  /**
   * Add commentary to a match
   */
  private addCommentary(matchId: string, commentary: Omit<CommentaryEntry, 'id' | 'timestamp' | 'matchId'>): void {
    const matchData = this.matches.get(matchId);
    if (!matchData) return;

    const entry: CommentaryEntry = {
      ...commentary,
      id: `commentary_${Date.now()}`,
      timestamp: new Date(),
      matchId,
    };

    matchData.commentary.push(entry);
  }

  /**
   * Generate shot commentary
   */
  private generateShotCommentary(shot: ShotData): string {
    const commentaries = [
      'Incredible shot!',
      'That was a close one!',
      'Strategic play by the player.',
      'The tension is building!',
      'What a skillful execution!',
    ];

    return commentaries[Math.floor(Math.random() * commentaries.length)];
  }

  /**
   * Get the next player in the match
   */
  private getNextPlayer(match: Match, currentPlayerId: string): Participant | undefined {
    // Find the participant by ID
    // This would need to be implemented based on how participants are stored
    // For now, return undefined as this is a placeholder
    return undefined;
  }

  /**
   * Start real-time updates simulation
   */
  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.matches.forEach((matchData, matchId) => {
        if (matchData.isLive) {
          // Simulate spectator count changes
          matchData.spectators += Math.floor(Math.random() * 3) - 1;
          matchData.spectators = Math.max(5, Math.min(100, matchData.spectators));

          // Simulate occasional commentary
          if (Math.random() > 0.95) {
            this.addCommentary(matchId, {
              type: 'highlight',
              message: 'The crowd is on the edge of their seats!',
            });
          }

          this.notifySubscribers(matchId);
        }
      });
    }, 5000);
  }

  /**
   * Notify all subscribers of a match update
   */
  private notifySubscribers(matchId: string): void {
    const matchData = this.matches.get(matchId);
    const subscribers = this.subscribers.get(matchId);

    if (matchData && subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(matchData);
        } catch (error) {
          console.error('Error in match subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Update match status
   */
  updateMatchStatus(matchId: string, status: MatchStatus): void {
    const matchData = this.matches.get(matchId);
    if (!matchData) return;

    matchData.match.status = status;
    matchData.isLive = status === MatchStatus.IN_PROGRESS;

    this.addCommentary(matchId, {
      type: 'game',
      message: `Match status updated to ${status}`,
    });

    this.notifySubscribers(matchId);
  }

  /**
   * Get current match data
   */
  getMatchData(matchId: string): RealTimeMatchData | undefined {
    return this.matches.get(matchId);
  }

  /**
   * Get all active matches
   */
  getActiveMatches(): RealTimeMatchData[] {
    return Array.from(this.matches.values()).filter(match => match.isLive);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.matches.clear();
    this.subscribers.clear();
  }
}

// Export singleton instance
export const realTimeMatchService = new RealTimeMatchService(); 
