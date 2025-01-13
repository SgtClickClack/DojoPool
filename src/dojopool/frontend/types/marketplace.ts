export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemCategory = 'power-ups' | 'avatars' | 'accessories' | 'special';
export type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'popular';

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: ItemCategory;
  rarity: ItemRarity;
  stock: number;
  effects?: {
    type: string;
    value: number;
    duration?: number;
  }[];
  preview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem extends MarketplaceItem {
  quantity: number;
}

export interface InventoryItem extends MarketplaceItem {
  quantity: number;
  purchaseDate: string;
  expiresAt?: string;
  isActive?: boolean;
}

export interface Transaction {
  id: string;
  items: {
    item: MarketplaceItem;
    quantity: number;
    priceAtPurchase: number;
  }[];
  total: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
}

export interface WalletInfo {
  balance: number;
  currency: string;
  transactions: {
    id: string;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    timestamp: string;
  }[];
}

export interface MarketplaceFilters {
  category?: ItemCategory;
  sortBy?: SortOption;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  rarity?: ItemRarity[];
  inStock?: boolean;
}

export interface PurchaseResponse {
  success: boolean;
  transactionId: string;
  items: CartItem[];
  total: number;
  newBalance: number;
  timestamp: string;
}
