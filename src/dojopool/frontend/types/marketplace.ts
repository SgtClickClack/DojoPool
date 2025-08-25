export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  stock: number;
}

export interface InventoryItem extends MarketplaceItem {
  quantity: number;
  purchaseDate: number;
}

export interface TransactionItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  total: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}


