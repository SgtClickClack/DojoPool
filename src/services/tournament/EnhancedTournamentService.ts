import { Tournament, TournamentParticipant, TournamentMatch, TournamentFormat, TournamentStatus, MatchStatus } from '../../types/tournament';
import { realTimeAICommentaryService } from '../ai/RealTimeAICommentaryService';
import { NFTWalletService } from '../wallet/NFTWalletService';
import { TerritoryGameplayService } from '../territory/TerritoryGameplayService';

export interface TournamentReward {
  type: 'dojo_coins' | 'nft_trophy' | 'territory_claim' | 'avatar_upgrade' | 'clan_points';
  amount?: number;
  nftMetadata?: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
  };
  territoryId?: string;
  avatarUpgrade?: {
    type: 'evolution' | 'cosmetic' | 'ability';
    value: string;
  };
}

export interface PoolGodInteraction {
  god: 'ai_umpire' | 'match_commentator' | 'fluke_god';
  event: 'tournament_start' | 'match_begin' | 'match_end' | 'tournament_end' | 'upset_victory' | 'comeback_win';
  message: string;
  blessing?: {
    type: 'luck_boost' | 'skill_boost' | 'reputation_boost';
    duration: number;
    value: number;
  };
}

export interface TournamentAIEvent {
  type: 'commentary' | 'pool_god_interaction' | 'story_progression';
  data: any;
  timestamp: Date;
}

export class EnhancedTournamentService {
  private static instance: EnhancedTournamentService;
  private aiCommentaryService: typeof realTimeAICommentaryService;
  private nftWalletService: NFTWalletService;
  private territoryService: TerritoryGameplayService;
  private aiEvents: Map<string, TournamentAIEvent[]> = new Map();

  constructor() {
    this.aiCommentaryService = realTimeAICommentaryService;
    this.nftWalletService = new NFTWalletService();
    this.territoryService = new TerritoryGameplayService();
  }

  static getInstance(): EnhancedTournamentService {
    if (!EnhancedTournamentService.instance) {
      EnhancedTournamentService.instance = new EnhancedTournamentService();
    }
    return EnhancedTournamentService.instance;
  }

  /**
   * Start tournament with AI commentary and Pool God interactions
   */
  async startTournament(tournament: Tournament): Promise<void> {
    try {
      // Generate tournament start commentary
      const startCommentary = await this.aiCommentaryService.generateCommentary({
        eventType: 'highlight',
        description: `Tournament ${tournament.name} is starting!`,
        context: {
          tournament: {
            name: tournament.name,
            format: tournament.format,
            participantCount: tournament.participantCount,
            prizePool: tournament.prizePool
          }
        }
      });

      // Pool God blessing for tournament start
      const poolGodInteraction = await this.generatePoolGodInteraction('tournament_start', tournament);
      
      // Emit AI events
      this.emitAIEvent(tournament.id.toString(), {
        type: 'commentary',
        data: startCommentary,
        timestamp: new Date()
      });

      this.emitAIEvent(tournament.id.toString(), {
        type: 'pool_god_interaction',
        data: poolGodInteraction,
        timestamp: new Date()
      });

      console.log(`Tournament ${tournament.name} started with AI commentary and Pool God interactions`);
    } catch (error) {
      console.error('Error starting tournament with AI:', error);
    }
  }

  /**
   * Process match with enhanced AI commentary and Pool God interactions
   */
  async processMatch(
    tournament: Tournament,
    match: TournamentMatch,
    winner: TournamentParticipant,
    loser: TournamentParticipant,
    matchData: {
      duration: number;
      totalShots: number;
      accuracy: number;
      specialShots: string[];
      comebacks: number;
    }
  ): Promise<void> {
    try {
      // Generate match commentary
      const matchCommentary = await this.aiCommentaryService.generateCommentary({
        eventType: 'highlight',
        description: `Match ${match.id} completed!`,
        context: {
          match: {
            id: match.id,
            round: match.roundNumber,
            winner: winner.username,
            loser: loser.username,
            duration: matchData.duration,
            totalShots: matchData.totalShots,
            accuracy: matchData.accuracy,
            specialShots: matchData.specialShots,
            comebacks: matchData.comebacks
          },
          tournament: {
            name: tournament.name,
            format: tournament.format
          }
        }
      });

      // Determine if this is an upset or comeback
      const isUpset = this.isUpsetVictory(winner, loser);
      const isComeback = matchData.comebacks > 0;

      // Generate Pool God interaction based on match outcome
      let poolGodEvent: string = 'match_end';
      if (isUpset) poolGodEvent = 'upset_victory';
      if (isComeback) poolGodEvent = 'comeback_win';

      const poolGodInteraction = await this.generatePoolGodInteraction(poolGodEvent, tournament, {
        winner,
        loser,
        matchData
      });

      // Emit AI events
      this.emitAIEvent(tournament.id.toString(), {
        type: 'commentary',
        data: matchCommentary,
        timestamp: new Date()
      });

      this.emitAIEvent(tournament.id.toString(), {
        type: 'pool_god_interaction',
        data: poolGodInteraction,
        timestamp: new Date()
      });

      // Apply Pool God blessings
      if (poolGodInteraction.blessing) {
        await this.applyPoolGodBlessing(winner.id.toString(), poolGodInteraction.blessing);
      }

      console.log(`Match ${match.id} processed with enhanced AI commentary`);
    } catch (error) {
      console.error('Error processing match with AI:', error);
    }
  }

  /**
   * Complete tournament with final AI commentary and rewards
   */
  async completeTournament(
    tournament: Tournament,
    winner: TournamentParticipant,
    finalMatch: TournamentMatch
  ): Promise<TournamentReward[]> {
    try {
      // Generate tournament completion commentary
      const completionCommentary = await this.aiCommentaryService.generateCommentary({
        eventType: 'highlight',
        description: `Tournament ${tournament.name} completed!`,
        context: {
          tournament: {
            name: tournament.name,
            format: tournament.format,
            participantCount: tournament.participantCount,
            prizePool: tournament.prizePool
          },
          winner: {
            username: winner.username,
            finalPlacement: winner.finalPlacement
          }
        }
      });

      // Pool God blessing for tournament completion
      const poolGodInteraction = await this.generatePoolGodInteraction('tournament_end', tournament, {
        winner,
        finalMatch
      });

      // Emit AI events
      this.emitAIEvent(tournament.id.toString(), {
        type: 'commentary',
        data: completionCommentary,
        timestamp: new Date()
      });

      this.emitAIEvent(tournament.id.toString(), {
        type: 'pool_god_interaction',
        data: poolGodInteraction,
        timestamp: new Date()
      });

      // Generate and distribute rewards
      const rewards = await this.generateTournamentRewards(tournament, winner);
      await this.distributeRewards(winner.id.toString(), rewards);

      // Apply Pool God blessings
      if (poolGodInteraction.blessing) {
        await this.applyPoolGodBlessing(winner.id.toString(), poolGodInteraction.blessing);
      }

      console.log(`Tournament ${tournament.name} completed with rewards and AI commentary`);
      return rewards;
    } catch (error) {
      console.error('Error completing tournament with AI:', error);
      return [];
    }
  }

  /**
   * Generate Pool God interaction based on event type
   */
  private async generatePoolGodInteraction(
    event: string,
    tournament: Tournament,
    context?: any
  ): Promise<PoolGodInteraction> {
    const gods = ['ai_umpire', 'match_commentator', 'fluke_god'] as const;
    const selectedGod = gods[Math.floor(Math.random() * gods.length)];

    let message = '';
    let blessing: PoolGodInteraction['blessing'] | undefined;

    switch (event) {
      case 'tournament_start':
        message = `The ${selectedGod} blesses this tournament with divine favor!`;
        blessing = {
          type: 'luck_boost',
          duration: 3600000, // 1 hour
          value: 0.1
        };
        break;
      case 'match_end':
        message = `The ${selectedGod} observes this match with great interest.`;
        break;
      case 'upset_victory':
        message = `The ${selectedGod} smiles upon this unexpected triumph!`;
        blessing = {
          type: 'reputation_boost',
          duration: 7200000, // 2 hours
          value: 0.2
        };
        break;
      case 'comeback_win':
        message = `The ${selectedGod} rewards this incredible comeback!`;
        blessing = {
          type: 'skill_boost',
          duration: 5400000, // 1.5 hours
          value: 0.15
        };
        break;
      case 'tournament_end':
        message = `The ${selectedGod} crowns the champion with divine approval!`;
        blessing = {
          type: 'reputation_boost',
          duration: 86400000, // 24 hours
          value: 0.5
        };
        break;
      default:
        message = `The ${selectedGod} watches over this event.`;
    }

    return {
      god: selectedGod,
      event: event as any,
      message,
      blessing
    };
  }

  /**
   * Generate tournament rewards based on tournament type and winner performance
   */
  private async generateTournamentRewards(
    tournament: Tournament,
    winner: TournamentParticipant
  ): Promise<TournamentReward[]> {
    const rewards: TournamentReward[] = [];

    // Dojo Coins reward
    rewards.push({
      type: 'dojo_coins',
      amount: tournament.prizePool
    });

    // NFT Trophy reward
    const nftTrophy = await this.generateNFTTrophy(tournament, winner);
    rewards.push({
      type: 'nft_trophy',
      nftMetadata: nftTrophy
    });

    // Avatar upgrade reward
    rewards.push({
      type: 'avatar_upgrade',
      avatarUpgrade: {
        type: 'evolution',
        value: 'tournament_champion'
      }
    });

    return rewards;
  }

  /**
   * Generate NFT trophy metadata for tournament winner
   */
  private async generateNFTTrophy(
    tournament: Tournament,
    winner: TournamentParticipant
  ): Promise<any> {
    const trophyName = `${tournament.name} Champion Trophy`;
    const trophyDescription = `Awarded to ${winner.username} for winning the ${tournament.name} tournament. Blessed by the Pool Gods.`;

    return {
      name: trophyName,
      description: trophyDescription,
      image: `https://dojopool.com/trophies/${tournament.format}_champion.png`,
      attributes: [
        { trait_type: 'Tournament', value: tournament.name },
        { trait_type: 'Format', value: tournament.format },
        { trait_type: 'Winner', value: winner.username },
        { trait_type: 'Date', value: new Date().toISOString().split('T')[0] },
        { trait_type: 'Rarity', value: 'Legendary' },
        { trait_type: 'Blessing', value: 'Pool God Favor' }
      ]
    };
  }

  /**
   * Apply Pool God blessing to player
   */
  private async applyPoolGodBlessing(playerId: string, blessing: PoolGodInteraction['blessing']): Promise<void> {
    if (!blessing) return;

    try {
      // Apply blessing to player stats
      console.log(`Applying ${blessing.type} blessing to player ${playerId}`);
      
      // Here you would integrate with the player progression system
      // For now, we'll just log the blessing
      setTimeout(() => {
        console.log(`Blessing ${blessing.type} expired for player ${playerId}`);
      }, blessing.duration);
    } catch (error) {
      console.error('Error applying Pool God blessing:', error);
    }
  }

  /**
   * Distribute rewards to tournament winner
   */
  private async distributeRewards(playerId: string, rewards: TournamentReward[]): Promise<void> {
    try {
      for (const reward of rewards) {
        switch (reward.type) {
          case 'dojo_coins':
            if (reward.amount) {
              console.log(`Awarding ${reward.amount} Dojo Coins to player ${playerId}`);
              // Integrate with Dojo Coin system
            }
            break;
          case 'nft_trophy':
            if (reward.nftMetadata) {
              console.log(`Minting NFT trophy for player ${playerId}`);
              // Integrate with NFT minting system
            }
            break;
          case 'avatar_upgrade':
            if (reward.avatarUpgrade) {
              console.log(`Upgrading avatar for player ${playerId}`);
              // Integrate with avatar progression system
            }
            break;
          case 'clan_points':
            if (reward.amount) {
              console.log(`Awarding ${reward.amount} clan points to player ${playerId}`);
              // Integrate with clan system
            }
            break;
        }
      }
    } catch (error) {
      console.error('Error distributing rewards:', error);
    }
  }

  /**
   * Check if a victory is an upset based on player rankings
   */
  private isUpsetVictory(winner: TournamentParticipant, loser: TournamentParticipant): boolean {
    // For now, we'll use a simple random check
    // In a real implementation, you'd compare player ratings/rankings
    return Math.random() > 0.7; // 30% chance of upset
  }

  /**
   * Emit AI event for tournament
   */
  private emitAIEvent(tournamentId: string, event: TournamentAIEvent): void {
    if (!this.aiEvents.has(tournamentId)) {
      this.aiEvents.set(tournamentId, []);
    }
    this.aiEvents.get(tournamentId)!.push(event);
  }

  /**
   * Get AI events for a tournament
   */
  getTournamentAIEvents(tournamentId: string): TournamentAIEvent[] {
    return this.aiEvents.get(tournamentId) || [];
  }

  /**
   * Clear AI events for a tournament
   */
  clearTournamentAIEvents(tournamentId: string): void {
    this.aiEvents.delete(tournamentId);
  }
}

// Export singleton instance
export default EnhancedTournamentService.getInstance(); 