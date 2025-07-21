import { MatchDataService, MatchData, MatchEvent } from './MatchDataService';
import { MatchAnalyticsService } from './MatchAnalyticsService';
import { MatchHighlightsService } from './MatchHighlightsService';
import { MatchRewardsService, MatchResult, MatchRewards } from './MatchRewardsService';
import { ChallengeService } from '../ChallengeService';

export class RealTimeMatchTrackingService {
  private matchDataService: MatchDataService;
  private analyticsService: MatchAnalyticsService;
  private highlightsService: MatchHighlightsService;
  private rewardsService: MatchRewardsService;
  private challengeService: ChallengeService;

  constructor() {
    this.matchDataService = new MatchDataService();
    this.analyticsService = new MatchAnalyticsService();
    this.highlightsService = new MatchHighlightsService();
    this.rewardsService = new MatchRewardsService();
    this.challengeService = new ChallengeService();
  }

  async startMatchTracking(challengeId: string): Promise<MatchData> {
    return this.matchDataService.startMatchTracking(challengeId);
  }

  activateMatch(matchId: string): void {
    this.matchDataService.activateMatch(matchId);
  }

  async recordShot(matchId: string, shotData: {
    playerId: string;
    shotType: string;
    success: boolean;
    power: number;
    spin: number;
    accuracy: number;
    ballPositions: any[];
    timestamp: Date;
  }): Promise<void> {
    const match = this.matchDataService.getMatchData(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Analyze shot with AI
    const analysis = await this.analyticsService.analyzeShot(shotData);

    // Create shot event
    const shotEvent: MatchEvent = {
      id: `shot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shot',
      timestamp: shotData.timestamp,
      playerId: shotData.playerId,
      description: `${shotData.shotType} shot by ${shotData.playerId}`,
      data: {
        ...shotData,
        analysis,
      },
      confidence: analysis.confidence,
      aiAnalysis: analysis,
    };

    // Update match data
    match.events.push(shotEvent);
    if (shotData.success) {
      if (shotData.playerId === match.player1Id) {
        match.score.player1++;
      } else {
        match.score.player2++;
      }
    }

    // Update analytics
    this.analyticsService.updateMatchAnalytics(matchId, match);

    // Emit events
    this.matchDataService.emit('shot_recorded', { matchId, shotEvent });
  }

  async recordFoul(matchId: string, foulData: {
    playerId: string;
    foulType: string;
    severity: 'minor' | 'major' | 'serious';
    description: string;
    timestamp: Date;
  }): Promise<void> {
    const match = this.matchDataService.getMatchData(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Analyze foul with AI
    const analysis = await this.analyticsService.analyzeFoul(foulData);

    // Create foul event
    const foulEvent: MatchEvent = {
      id: `foul_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'foul',
      timestamp: foulData.timestamp,
      playerId: foulData.playerId,
      description: `${foulData.foulType} foul by ${foulData.playerId}`,
      data: {
        ...foulData,
        analysis,
      },
      confidence: analysis.confidence,
      aiAnalysis: analysis,
    };

    // Update match data
    match.events.push(foulEvent);

    // Update analytics
    this.analyticsService.updateMatchAnalytics(matchId, match);

    // Emit events
    this.matchDataService.emit('foul_detected', { matchId, foulEvent });
  }

  async completeMatch(matchId: string, winnerId: string): Promise<MatchResult> {
    const match = this.matchDataService.getMatchData(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Set match as completed
    match.status = 'completed';
    match.endTime = new Date();
    match.winnerId = winnerId;

    // Generate final analytics
    const finalAnalytics = await this.analyticsService.generateFinalAnalytics(match);
    match.matchAnalytics = finalAnalytics;

    // Generate highlights
    const highlights = await this.highlightsService.generateHighlights(match);
    match.highlights = highlights;

    // Complete match and get results
    const result = await this.rewardsService.completeMatch(match, winnerId);

    // Update challenge status
    await this.updateChallengeStatus(match.challengeId, result);

    // Distribute rewards
    await this.distributeRewards(result);

    // Emit completion event
    this.matchDataService.emit('match_completed', result);

    return result;
  }

  getMatchData(matchId: string): MatchData | null {
    return this.matchDataService.getMatchData(matchId);
  }

  getActiveMatches(): MatchData[] {
    return this.matchDataService.getActiveMatches();
  }

  subscribeToMatch(matchId: string, callback: (data: any) => void): void {
    this.matchDataService.subscribeToMatch(matchId, callback);
  }

  unsubscribeFromMatch(matchId: string, callback: (data: any) => void): void {
    this.matchDataService.unsubscribeFromMatch(matchId, callback);
  }

  isConnected(): boolean {
    return this.matchDataService.isConnected();
  }

  disconnect(): void {
    this.matchDataService.disconnect();
  }

  private async updateChallengeStatus(challengeId: string, matchResult: MatchResult): Promise<void> {
    try {
      await this.challengeService.updateChallengeStatus(challengeId, {
        status: 'completed',
        winnerId: matchResult.winnerId,
        matchResult,
      });
    } catch (error) {
      console.error('Failed to update challenge status:', error);
    }
  }

  private async distributeRewards(matchResult: MatchResult): Promise<void> {
    try {
      // Here you would integrate with your wallet/economy services
      // to actually distribute the rewards
      console.log('Distributing rewards:', matchResult.rewards);
    } catch (error) {
      console.error('Failed to distribute rewards:', error);
    }
  }
} 