/**
 * Represents the structure of a User Wallet.
 */
export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Represents the structure of a Wallet Transaction.
 */
export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
}

/**
 * Represents the structure of Wallet Statistics.
 * Based on usage in WalletDashboard.tsx and backend WalletService query.
 */
export interface WalletStats {
  total_transactions: number;
  total_volume: number;
  total_incoming: number;
  total_outgoing: number;
  rewards?: Record<
    string,
    {
      count: number;
      total_amount: number;
    }
  >;
  rewards_count?: number;
  rewards_total_amount?: number;
}

export interface WalletData {
  balance: number; // Assuming this is the primary currency balance (Dojo Coins)
  otherTokens: FungibleToken[]; // Array for other fungible tokens (required)
}

export interface FungibleToken {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  contractAddress?: string; // Optional: Token contract address
  // Add other relevant token properties as needed
}
