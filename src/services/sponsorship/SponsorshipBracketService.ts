import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  SponsorshipBracket, 
  PlayerSponsorshipProgress,
  SponsorshipChallenge,
  SponsorshipEventType
} from '../../types/sponsorship';

export class SponsorshipBracketService {
  private static readonly BRACKETS_COLLECTION = 'sponsorshipBrackets';
  private static readonly PROGRESS_COLLECTION = 'sponsorshipProgress';
  private static readonly EVENTS_COLLECTION = 'sponsorshipEvents';

  // Real-time bracket listeners
  static subscribeToBrackets(callback: (brackets: SponsorshipBracket[]) => void) {
    const q = query(
      collection(db, this.BRACKETS_COLLECTION),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const brackets = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as unknown as SponsorshipBracket[];
      callback(brackets);
    });
  }

  static subscribeToPlayerProgress(playerId: string, callback: (progress: PlayerSponsorshipProgress[]) => void) {
    const q = query(
      collection(db, this.PROGRESS_COLLECTION),
      where('playerId', '==', playerId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const progress = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as unknown as PlayerSponsorshipProgress[];
      callback(progress);
    });
  }

  // Check if player meets bracket requirements
  static async checkBracketEligibility(playerId: string, bracket: SponsorshipBracket): Promise<boolean> {
    try {
      // Get player profile to check level
      const playerDoc = await getDoc(doc(db, 'profiles', playerId));
      if (!playerDoc.exists()) return false;
      
      const playerData = playerDoc.data();
      const playerLevel = playerData.skillLevel || 0;
      
      // Check level requirement
      if (playerLevel < bracket.requiredLevel) return false;
      
      // Check if bracket is active and within date range
      if (!bracket.isActive) return false;
      
      const now = new Date();
      if (bracket.startDate && new Date(bracket.startDate) > now) return false;
      if (bracket.endDate && new Date(bracket.endDate) < now) return false;
      
      // Check participant limit
      if (bracket.maxParticipants && (bracket.currentParticipants || 0) >= bracket.maxParticipants) return false;
      
      return true;
    } catch (error) {
      console.error('Error checking bracket eligibility:', error);
      return false;
    }
  }

  // Auto-unlock brackets when player levels up
  static async checkAndUnlockBrackets(playerId: string, newLevel: number): Promise<SponsorshipBracket[]> {
    try {
      const bracketsSnapshot = await getDocs(
        query(
          collection(db, this.BRACKETS_COLLECTION),
          where('requiredLevel', '<=', newLevel),
          where('isActive', '==', true)
        )
      );
      
      const unlockedBrackets: SponsorshipBracket[] = [];
      
      for (const bracketDoc of bracketsSnapshot.docs) {
        const bracket = { ...bracketDoc.data(), id: bracketDoc.id } as unknown as SponsorshipBracket;
        
        // Check if player already has progress for this bracket
        const existingProgress = await getDoc(
          doc(db, this.PROGRESS_COLLECTION, `${playerId}_${bracket.bracketId}`)
        );
        
        if (!existingProgress.exists() && await this.checkBracketEligibility(playerId, bracket)) {
          // Unlock the bracket
          await this.unlockBracketForPlayer(playerId, bracket);
          unlockedBrackets.push(bracket);
        }
      }
      
      return unlockedBrackets;
    } catch (error) {
      console.error('Error checking and unlocking brackets:', error);
      return [];
    }
  }

  // Unlock bracket for player
  static async unlockBracketForPlayer(playerId: string, bracket: SponsorshipBracket): Promise<void> {
    try {
      const progressId = `${playerId}_${bracket.bracketId}`;
      const initialProgress: Record<string, any> = {};
      
      // Initialize challenge progress
      bracket.challenges.forEach(challenge => {
        initialProgress[challenge.challengeId] = {
          isCompleted: false,
          progress: 0,
        };
      });
      
      const playerProgress: PlayerSponsorshipProgress = {
        playerId,
        bracketId: bracket.bracketId,
        bracketTitle: bracket.inGameTitle,
        status: 'unlocked',
        challengeProgress: initialProgress,
        digitalRewardClaimed: false,
        physicalRewardRedeemed: false,
      };
      
      await setDoc(doc(db, this.PROGRESS_COLLECTION, progressId), {
        ...playerProgress,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // Update bracket participant count
      await updateDoc(doc(db, this.BRACKETS_COLLECTION, bracket.bracketId), {
        currentParticipants: (bracket.currentParticipants || 0) + 1,
        updatedAt: Timestamp.now(),
      });
      
      // Log event
      await this.logEvent('bracket_unlocked', playerId, bracket.bracketId);
    } catch (error) {
      console.error('Error unlocking bracket for player:', error);
      throw error;
    }
  }

  // Update challenge progress
  static async updateChallengeProgress(
    playerId: string, 
    bracketId: string, 
    challengeId: string, 
    progressValue: number,
    isCompleted: boolean = false
  ): Promise<void> {
    try {
      const progressId = `${playerId}_${bracketId}`;
      const progressDoc = await getDoc(doc(db, this.PROGRESS_COLLECTION, progressId));
      
      if (!progressDoc.exists()) {
        throw new Error('Player progress not found for this bracket');
      }
      
      const currentProgress = progressDoc.data() as PlayerSponsorshipProgress;
      const updatedChallengeProgress = { ...currentProgress.challengeProgress };
      
      updatedChallengeProgress[challengeId] = {
        isCompleted,
        progress: progressValue,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };
      
      // Get bracket to check if all challenges are completed
      const bracketDoc = await getDoc(doc(db, this.BRACKETS_COLLECTION, bracketId));
      if (!bracketDoc.exists()) throw new Error('Bracket not found');
      
      const bracket = bracketDoc.data() as SponsorshipBracket;
      const allChallengesCompleted = bracket.challenges.every(
        challenge => updatedChallengeProgress[challenge.challengeId]?.isCompleted
      );
      
      let newStatus = currentProgress.status;
      let completedAt = currentProgress.completedAt;
      
      if (allChallengesCompleted && newStatus !== 'completed') {
        newStatus = 'completed';
        completedAt = new Date().toISOString();
      } else if (newStatus === 'unlocked') {
        newStatus = 'in_progress';
      }
      
      // Update progress
      await updateDoc(doc(db, this.PROGRESS_COLLECTION, progressId), {
        challengeProgress: updatedChallengeProgress,
        status: newStatus,
        completedAt,
        updatedAt: Timestamp.now(),
      });
      
      // Log events
      if (isCompleted) {
        await this.logEvent('challenge_completed', playerId, bracketId, challengeId);
      }
      
      if (allChallengesCompleted && currentProgress.status !== 'completed') {
        await this.logEvent('bracket_completed', playerId, bracketId);
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  }

  // Check game events for challenge completion
  static async processGameEvent(
    playerId: string, 
    eventType: 'game_win' | 'trick_shot' | 'tournament_win' | 'level_up' | 'venue_capture',
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      // Get player's active brackets
      const progressSnapshot = await getDocs(
        query(
          collection(db, this.PROGRESS_COLLECTION),
          where('playerId', '==', playerId),
          where('status', 'in', ['unlocked', 'in_progress'])
        )
      );
      
      for (const progressDoc of progressSnapshot.docs) {
        const progress = progressDoc.data() as PlayerSponsorshipProgress;
        
        // Get bracket details
        const bracketDoc = await getDoc(doc(db, this.BRACKETS_COLLECTION, progress.bracketId));
        if (!bracketDoc.exists()) continue;
        
        const bracket = bracketDoc.data() as SponsorshipBracket;
        
        // Check each challenge for this event
        for (const challenge of bracket.challenges) {
          if (challenge.type === eventType && !progress.challengeProgress[challenge.challengeId]?.isCompleted) {
            const shouldUpdate = this.checkChallengeRequirement(challenge, eventData);
            
            if (shouldUpdate) {
              const currentProgress = progress.challengeProgress[challenge.challengeId]?.progress || 0;
              const newProgress = this.calculateNewProgress(challenge, currentProgress, eventData);
              const isCompleted = newProgress >= (challenge.maxProgress || challenge.requirement.count || 1);
              
              await this.updateChallengeProgress(
                playerId, 
                progress.bracketId, 
                challenge.challengeId, 
                newProgress, 
                isCompleted
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing game event:', error);
    }
  }

  private static checkChallengeRequirement(challenge: SponsorshipChallenge, eventData: Record<string, any>): boolean {
    switch (challenge.type) {
      case 'game_win':
        return true; // Any game win counts
      case 'trick_shot':
        return eventData.difficulty ? 
          (!challenge.requirement.difficulty || eventData.difficulty === challenge.requirement.difficulty) : true;
      case 'tournament':
        return eventData.tournamentType ? 
          (!challenge.requirement.venue_type || eventData.tournamentType === challenge.requirement.venue_type) : true;
      case 'level_reach':
        return eventData.newLevel >= (challenge.requirement.level || 1);
      case 'venue_capture':
        return eventData.venueType ? 
          (!challenge.requirement.venue_type || eventData.venueType === challenge.requirement.venue_type) : true;
      default:
        return false;
    }
  }

  private static calculateNewProgress(challenge: SponsorshipChallenge, currentProgress: number, eventData: Record<string, any>): number {
    switch (challenge.type) {
      case 'game_win':
      case 'trick_shot':
      case 'tournament':
      case 'venue_capture':
        return currentProgress + 1;
      case 'level_reach':
        return Math.max(currentProgress, eventData.newLevel || 0);
      case 'streak':
        return eventData.isStreakContinued ? currentProgress + 1 : 1;
      default:
        return currentProgress;
    }
  }

  // Claim rewards
  static async claimDigitalReward(playerId: string, bracketId: string): Promise<void> {
    try {
      const progressId = `${playerId}_${bracketId}`;
      await updateDoc(doc(db, this.PROGRESS_COLLECTION, progressId), {
        digitalRewardClaimed: true,
        updatedAt: Timestamp.now(),
      });
      
      await this.logEvent('digital_reward_claimed', playerId, bracketId);
    } catch (error) {
      console.error('Error claiming digital reward:', error);
      throw error;
    }
  }

  static async generateRedemptionCode(playerId: string, bracketId: string): Promise<string> {
    try {
      const redemptionCode = `${bracketId.toUpperCase()}-${playerId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      
      const progressId = `${playerId}_${bracketId}`;
      await updateDoc(doc(db, this.PROGRESS_COLLECTION, progressId), {
        physicalRewardRedeemed: true,
        redemptionCode,
        status: 'redeemed',
        updatedAt: Timestamp.now(),
      });
      
      await this.logEvent('physical_reward_redeemed', playerId, bracketId);
      
      return redemptionCode;
    } catch (error) {
      console.error('Error generating redemption code:', error);
      throw error;
    }
  }

  // Event logging
  private static async logEvent(
    eventType: SponsorshipEventType,
    playerId: string,
    bracketId: string,
    challengeId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const eventId = `${playerId}_${bracketId}_${eventType}_${Date.now()}`;
      await setDoc(doc(db, this.EVENTS_COLLECTION, eventId), {
        eventType,
        playerId,
        bracketId,
        challengeId,
        metadata,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error logging sponsorship event:', error);
    }
  }
}