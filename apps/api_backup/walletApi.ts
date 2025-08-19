import axiosInstance from './axiosInstance';

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  currency: string;
  is_active: boolean;
}

export const getWallet = async (): Promise<Wallet> => {
  const res = await axiosInstance.get('/v1/wallet');
  return res.data;
};
