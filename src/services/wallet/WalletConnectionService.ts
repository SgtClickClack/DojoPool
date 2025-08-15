import { ethers } from 'ethers';
import { env } from '.js';

// Add this for type safety
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletConnection {
  address: string;
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  chainId: number;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  contractAddress: string;
}

export class WalletConnectionService {
  private static instance: WalletConnectionService;
  private currentConnection: WalletConnection | null = null;
  
  // Dojo Coin contract details (update with actual deployed address)
  private readonly DOJO_COIN_ADDRESS = env.NEXT_PUBLIC_DOJO_COIN_ADDRESS || '';
  private readonly DOJO_COIN_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)'
  ];

  static getInstance(): WalletConnectionService {
    if (!WalletConnectionService.instance) {
      WalletConnectionService.instance = new WalletConnectionService();
    }
    return WalletConnectionService.instance;
  }

  async connectMetaMask(): Promise<WalletConnection> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      this.currentConnection = {
        address: account,
        provider,
        signer,
        chainId
      };

      return this.currentConnection;
    } catch (error: any) {
      throw new Error(`Failed to connect MetaMask: ${error?.message || error}`);
    }
  }

  async connectWalletConnect(): Promise<WalletConnection> {
    // Implementation for WalletConnect
    // This would require the WalletConnect library
    throw new Error('WalletConnect integration not yet implemented');
  }

  async disconnect(): Promise<void> {
    this.currentConnection = null;
  }

  async getDojoCoinBalance(address?: string): Promise<string> {
    if (!this.currentConnection) {
      throw new Error('No wallet connected');
    }

    const targetAddress = address || this.currentConnection.address;
    const contract = new ethers.Contract(
      this.DOJO_COIN_ADDRESS,
      this.DOJO_COIN_ABI,
      this.currentConnection.provider
    );

    try {
      const balance = await contract.balanceOf(targetAddress);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error: any) {
      throw new Error(`Failed to get Dojo Coin balance: ${error?.message || error}`);
    }
  }

  async transferDojoCoin(to: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.currentConnection) {
      throw new Error('No wallet connected');
    }

    const contract = new ethers.Contract(
      this.DOJO_COIN_ADDRESS,
      this.DOJO_COIN_ABI,
      this.currentConnection.signer
    );

    try {
      const decimals = await contract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      return await contract.transfer(to, amountWei);
    } catch (error: any) {
      throw new Error(`Failed to transfer Dojo Coin: ${error?.message || error}`);
    }
  }

  async getTokenInfo(): Promise<{ name: string; symbol: string; decimals: number }> {
    if (!this.currentConnection) {
      throw new Error('No wallet connected');
    }

    const contract = new ethers.Contract(
      this.DOJO_COIN_ADDRESS,
      this.DOJO_COIN_ABI,
      this.currentConnection.provider
    );

    try {
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      return { name, symbol, decimals };
    } catch (error: any) {
      throw new Error(`Failed to get token info: ${error?.message || error}`);
    }
  }

  async addDojoCoinToWallet(): Promise<void> {
    if (!this.currentConnection) {
      throw new Error('No wallet connected');
    }

    try {
      const tokenInfo = await this.getTokenInfo();
      
      // Add token to MetaMask
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: this.DOJO_COIN_ADDRESS,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            image: 'https://dojopool.com/images/dojo-coin-logo.png' // Update with actual logo URL
          }
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to add Dojo Coin to wallet: ${error?.message || error}`);
    }
  }

  getCurrentConnection(): WalletConnection | null {
    return this.currentConnection;
  }

  isConnected(): boolean {
    return this.currentConnection !== null;
  }

  async switchToEthereumMainnet(): Promise<void> {
    if (!this.currentConnection) {
      throw new Error('No wallet connected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }] // Ethereum mainnet
      });
    } catch (error: any) {
      throw new Error(`Failed to switch to Ethereum mainnet: ${error?.message || error}`);
    }
  }

  async switchToPolygon(): Promise<void> {
    if (!this.currentConnection) {
      throw new Error('No wallet connected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }] // Polygon mainnet
      });
    } catch (error: any) {
      throw new Error(`Failed to switch to Polygon: ${error?.message || error}`);
    }
  }
}

// Global instance
export const walletConnectionService = WalletConnectionService.getInstance(); 
