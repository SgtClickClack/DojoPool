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
  id: number;
  wallet_id: number;
  user_id: number;
  amount: number;
  currency: string;
  type: string;
  transaction_type: string;
  status: string;
  description: string | null;
  reference_id: string | null;
  metadata?: {
      reward_type?: string;
      multiplier?: number;
      [key: string]: any;
  } | null;
  created_at: string | null;
  updated_at: string | null;
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
  rewards?: Record<string, {
      count: number;
      total_amount: number;
  }>;
  rewards_count?: number;
  rewards_total_amount?: number;
} 