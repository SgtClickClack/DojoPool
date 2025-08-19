// Temporarily disabled - stub service for wallet connection
export interface WalletConnection {
  id: string;
  address: string;
  network: string;
  isConnected: boolean;
}

export const walletConnectionService = {
  connect: async (): Promise<WalletConnection | null> => {
    console.log('Wallet connection temporarily disabled');
    return null;
  },
  connectMetaMask: async (): Promise<WalletConnection | null> => {
    console.log('MetaMask connection temporarily disabled');
    return null;
  },
  disconnect: async (): Promise<void> => {
    console.log('Wallet disconnection temporarily disabled');
  },
  getConnection: (): WalletConnection | null => {
    console.log('Wallet connection retrieval temporarily disabled');
    return null;
  },
  getCurrentConnection: (): WalletConnection | null => {
    console.log('Current wallet connection retrieval temporarily disabled');
    return null;
  },
  getDojoCoinBalance: async (address?: string): Promise<string> => {
    console.log('Dojo coin balance retrieval temporarily disabled', { address });
    return '0';
  },
  transferDojoCoin: async (to: string, amount: string): Promise<any> => {
    console.log('Dojo coin transfer temporarily disabled', { to, amount });
    return { success: false, error: 'Transfer temporarily disabled' };
  },
  addDojoCoinToWallet: async (): Promise<void> => {
    console.log('Add Dojo coin to wallet temporarily disabled');
  },
  switchToEthereumMainnet: async (): Promise<void> => {
    console.log('Switch to Ethereum mainnet temporarily disabled');
  },
  switchToPolygon: async (): Promise<void> => {
    console.log('Switch to Polygon temporarily disabled');
  }
};
