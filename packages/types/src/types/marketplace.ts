export interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: 'DOJO' | 'USD' | 'ETH' | 'SOL';
  sellerId: string;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: 'DOJO' | 'USD' | 'ETH' | 'SOL';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
}
