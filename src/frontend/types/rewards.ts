export interface RewardItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  type: 'dojo_coins' | 'nft' | 'achievement' | 'boost';
  earnedDate?: string;
  points_cost: number;
  tier?: { id: string; name: string };
}
