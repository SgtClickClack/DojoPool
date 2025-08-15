export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rarity: string;
  stock: number;
  effects?: Array<{ type: string; value: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem extends MarketplaceItem {
  quantity: number;
}

export interface InventoryItem extends MarketplaceItem {
  quantity: number;
  purchaseDate: string;
}

export interface Transaction {
  id: string;
  items: Array<CartItem & { priceAtPurchase: number }>;
  total: number;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}
