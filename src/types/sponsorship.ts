export interface SponsorshipChallenge {
  challengeId: string;
  description: string;
  type: 'game_win' | 'trick_shot' | 'streak' | 'tournament' | 'level_reach' | 'venue_capture';
  requirement: {
    count?: number;
    streak?: number;
    level?: number;
    venue_type?: string;
    difficulty?: string;
  };
  isCompleted: boolean;
  completedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface DigitalReward {
  itemName: string;
  itemDescription: string;
  itemAssetUrl?: string;
  type: 'cue' | 'title' | 'avatar_item' | 'boost' | 'currency';
  value?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PhysicalReward {
  rewardName: string;
  rewardDescription: string;
  redemptionInstructions: string;
  estimatedValue?: number;
  shippingInfo?: string;
  isRedeemed: boolean;
  redemptionCode?: string;
  redemptionDeadline?: string;
}

export interface SponsorshipBracket {
  bracketId: string;
  sponsorName: string;
  sponsorLogo?: string;
  inGameTitle: string;
  requiredLevel: number;
  narrativeIntro: string;
  narrativeOutro: string;
  challenges: SponsorshipChallenge[];
  digitalReward: DigitalReward;
  physicalReward: PhysicalReward;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerSponsorshipProgress {
  playerId: string;
  bracketId: string;
  bracketTitle: string;
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'redeemed';
  challengeProgress: Record<string, {
    isCompleted: boolean;
    progress: number;
    completedAt?: string;
  }>;
  startedAt?: string;
  completedAt?: string;
  digitalRewardClaimed: boolean;
  physicalRewardRedeemed: boolean;
  redemptionCode?: string;
}

export interface SponsorshipStats {
  totalBrackets: number;
  activeBrackets: number;
  completedBrackets: number;
  unlockedBrackets: number;
  totalRewardsEarned: number;
  physicalRewardsRedeemed: number;
}

export interface SponsorshipLeaderboard {
  playerId: string;
  playerName: string;
  completedBrackets: number;
  totalPoints: number;
  rank: number;
}

export type SponsorshipEventType = 
  | 'bracket_unlocked'
  | 'challenge_completed'
  | 'bracket_completed'
  | 'digital_reward_claimed'
  | 'physical_reward_redeemed';

export interface SponsorshipEvent {
  eventType: SponsorshipEventType;
  playerId: string;
  bracketId: string;
  challengeId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}