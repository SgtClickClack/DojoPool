export interface Wallet {
  id: number | string;
  user_id: number | string;
  balance: number;
  currency: string;
  is_active: boolean;
}
