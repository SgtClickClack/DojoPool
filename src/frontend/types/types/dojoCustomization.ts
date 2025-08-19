export interface CustomizationItem {
  id: string;
  name: string;
  description?: string;
  type:
    | 'FLOOR'
    | 'WALL'
    | 'DECORATION'
    | 'LIGHTING'
    | 'SOUND'
    | 'FURNITURE'
    | 'ARTWORK';
  category: 'BASIC' | 'PREMIUM' | 'LEGENDARY' | 'EVENT' | 'SEASONAL';
  imageUrl?: string;
  previewUrl?: string;
  rarity: number;
  unlockCost: number;
  requirements: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DojoCustomization {
  id: string;
  dojoId: string;
  customizationItemId: string;
  customizationItem: CustomizationItem;
  isApplied: boolean;
  appliedAt?: string;
  unlockedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DojoCustomizationCreate {
  customizationItemId: string;
  isApplied?: boolean;
}

export interface DojoCustomizationUpdate {
  isApplied?: boolean;
}

export interface DojoCustomizationResponse {
  customizations: DojoCustomization[];
  totalCustomizations: number;
  appliedCustomizations: number;
}

export interface CustomizationItemsResponse {
  items: CustomizationItem[];
  totalItems: number;
  categories: string[];
  types: string[];
}

export interface DojoCustomizationStats {
  totalUnlocked: number;
  totalApplied: number;
  availableSlots: number;
  customizationLevel: number;
}
