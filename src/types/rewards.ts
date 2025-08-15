export interface RewardItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  // Updated type to reflect usage in RewardsDashboard.tsx, consider using an enum
  type: 'dojo_coins' | 'nft' | 'achievement' | 'boost';
  // Consider ISO string format
  earnedDate?: string; // Make earnedDate optional as it might not be present for available rewards
  points_cost: number; // Added points_cost based on RewardsDashboard usage
  tier?: { id: string; name: string }; // Uncommented tier property
  // Potential future fields:
  // transactionId?: string; // If related to a blockchain transaction
  // rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  // collection?: string; // If part of a set
  // metadataUrl?: string; // For NFTs pointing to more details
}

// You might also define related types or enums here, for example:
// export enum RewardType { NFT = 'NFT', ITEM = 'Item', BADGE = 'Badge' } 