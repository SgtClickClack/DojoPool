export interface AvatarCustomizationData {
  hair?: string; // AvatarAsset ID
  face?: string; // AvatarAsset ID
  clothesTop?: string; // AvatarAsset ID
  clothesBottom?: string; // AvatarAsset ID
  shoes?: string; // AvatarAsset ID
  accessoryHead?: string; // AvatarAsset ID
  accessoryNeck?: string; // AvatarAsset ID
  accessoryBack?: string; // AvatarAsset ID
  weapon?: string; // AvatarAsset ID
  pet?: string; // AvatarAsset ID
  effect?: string; // AvatarAsset ID
  skinTone?: string;
  bodyType?: string;
  height?: number;
}

export interface AvatarAsset {
  id: string;
  name: string;
  description?: string;
  type: AvatarAssetType;
  rarity: AvatarAssetRarity;
  assetUrl2D?: string;
  assetUrl3D?: string;
  thumbnailUrl?: string;
  price: number;
  isPremium: boolean;
  isActive: boolean;
  statBonuses: Record<string, number>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export enum AvatarAssetType {
  HAIR = 'HAIR',
  FACE = 'FACE',
  CLOTHES_TOP = 'CLOTHES_TOP',
  CLOTHES_BOTTOM = 'CLOTHES_BOTTOM',
  SHOES = 'SHOES',
  ACCESSORY_HEAD = 'ACCESSORY_HEAD',
  ACCESSORY_NECK = 'ACCESSORY_NECK',
  ACCESSORY_BACK = 'ACCESSORY_BACK',
  WEAPON = 'WEAPON',
  PET = 'PET',
  EFFECT = 'EFFECT',
}

export enum AvatarAssetRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export interface UserAvatarAsset {
  id: string;
  userId: string;
  assetId: string;
  asset: AvatarAsset;
  acquiredAt: string;
  acquiredVia: string;
  isEquipped: boolean;
}

export interface AvatarData {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profile?: {
      avatarUrl?: string;
      displayName?: string;
    };
  };
  configuration: AvatarCustomizationData;
  skinTone: string;
  bodyType: string;
  height: number;
  unlockedFeatures: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AvatarPurchaseRequest {
  assetId: string;
}

export interface AvatarAwardRequest {
  userId: string;
  assetId: string;
  reason?: string;
}

export interface AvatarCustomizationRequest extends AvatarCustomizationData {}

export interface AvatarCustomizationResponse {
  success: boolean;
  avatar: AvatarData;
  message: string;
}

export interface AvatarPurchaseResponse {
  success: boolean;
  ownership: UserAvatarAsset;
  message: string;
}

export interface AvatarAssetListResponse {
  assets: AvatarAsset[];
  totalCount: number;
  categories: {
    [key: string]: AvatarAsset[];
  };
}

export interface UserAvatarAssetsResponse {
  assets: UserAvatarAsset[];
  equippedCount: number;
  ownedCount: number;
}
