export interface RewardItem {
  id: string;
  name: string;
  description: string;
  type: 'achievement' | 'tournament' | 'daily' | 'special';
  points: number;
  icon?: string;
  unlockedAt?: string;
  claimedAt?: string;
  isClaimed: boolean;
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  userId: string;
  claimedAt: string;
  points: number;
}
