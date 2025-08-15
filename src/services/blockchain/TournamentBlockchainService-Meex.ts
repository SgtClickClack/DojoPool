import { io, Socket } from 'socket.io-client';

export interface BlockchainTransaction {
  id: string;
  type: 'payment' | 'reward' | 'entry_fee' | 'prize_payout';
  amount: number;
  currency: 'DOJO' | 'ETH' | 'SOL';
  from: string;
  to: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  tournamentId?: string;
  matchId?: string;
  playerId?: string;
  gasFee?: number;
  blockNumber?: number;
  transactionHash?: string;
}

export interface WalletInfo {
  address: string;
  balance: {
    DOJO: number;
    ETH: number;
    SOL: number;
  };
  isConnected: boolean;
  network: 'ethereum' | 'solana' | 'polygon';
  lastSync: Date;
}

export interface SmartContract {
  address: string;
  name: string;
  type: 'tournament' | 'token' | 'nft' | 'governance';
  network: 'ethereum' | 'solana' | 'polygon';
  abi?: any;
  functions: string[];
  events: string[];
  lastUpdate: Date;
}

export interface NFTMetadata {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  tournamentId?: string;
  playerId?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  mintDate: Date;
}

export interface DeFiPool {
  id: string;
  name: string;
  tokens: string[];
  liquidity: number;
  volume24h: number;
  apy: number;
  tvl: number;
  lastUpdate: Date;
}

class TournamentBlockchainService {
  private static instance: TournamentBlockchainService;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  // Blockchain state
  private transactions: BlockchainTransaction[] = [];
  private wallets: Map<string, WalletInfo> = new Map();
  private smartContracts: SmartContract[] = [];
  private nfts: NFTMetadata[] = [];
  private defiPools: DeFiPool[] = [];
  private gasPrices: { [key: string]: number } = {};

  // Configuration
  private config = {
    networks: {
      ethereum: {
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        chainId: 1,
        name: 'Ethereum Mainnet'
      },
      solana: {
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        chainId: 101,
        name: 'Solana Mainnet'
      },
      polygon: {
        rpcUrl: 'https://polygon-rpc.com',
        chainId: 137,
        name: 'Polygon Mainnet'
      }
    },
    contracts: {
      dojoToken: '0x1234567890123456789012345678901234567890',
      tournamentFactory: '0x0987654321098765432109876543210987654321',
      nftCollection: '0xabcdef1234567890abcdef1234567890abcdef12'
    },
    gasLimit: 300000,
    maxGasPrice: 100 // gwei
  };

  private constructor() {
    this.initializeWebSocket();
    this.loadMockData();
  }

  public static getInstance(): TournamentBlockchainService {
    if (!TournamentBlockchainService.instance) {
      TournamentBlockchainService.instance = new TournamentBlockchainService();
    }
    return TournamentBlockchainService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval
      });

      this.socket.on('connect', () => {
        console.log('🔗 Blockchain service connected to WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('blockchain:join', { service: 'blockchain' });
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Blockchain service disconnected from WebSocket');
        this.isConnected = false;
        this.handleReconnection();
      });

      this.socket.on('blockchain:transaction_update', (data: BlockchainTransaction) => {
        this.updateTransaction(data);
      });

      this.socket.on('blockchain:wallet_update', (data: WalletInfo) => {
        this.updateWallet(data);
      });

      this.socket.on('blockchain:gas_update', (data: { network: string; price: number }) => {
        this.updateGasPrice(data.network, data.price);
      });

      this.socket.on('blockchain:nft_minted', (data: NFTMetadata) => {
        this.addNFT(data);
      });

      this.socket.on('blockchain:defi_update', (data: DeFiPool) => {
        this.updateDeFiPool(data);
      });

    } catch (error) {
      console.error('❌ Failed to initialize blockchain WebSocket:', error);
      this.handleReconnection();
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect blockchain service (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    } else {
      console.error('❌ Max reconnection attempts reached for blockchain service');
    }
  }

  // Transaction Management
  public async createTransaction(transaction: Omit<BlockchainTransaction, 'id' | 'timestamp'>): Promise<BlockchainTransaction> {
    const newTransaction: BlockchainTransaction = {
      ...transaction,
      id: this.generateId(),
      timestamp: new Date(),
      status: 'pending'
    };

    this.transactions.push(newTransaction);
    this.socket?.emit('blockchain:transaction_created', newTransaction);

    // Simulate blockchain confirmation
    setTimeout(() => {
      this.confirmTransaction(newTransaction.id);
    }, 3000 + Math.random() * 2000);

    return newTransaction;
  }

  public async confirmTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.find(t => t.id === transactionId);
    if (transaction) {
      transaction.status = 'confirmed';
      transaction.blockNumber = Math.floor(Math.random() * 1000000) + 1;
      transaction.transactionHash = `0x${this.generateId()}${this.generateId()}`;
      transaction.gasFee = Math.random() * 0.01;

      this.socket?.emit('blockchain:transaction_confirmed', transaction);
    }
  }

  public getTransactions(): BlockchainTransaction[] {
    return [...this.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getTransactionById(id: string): BlockchainTransaction | undefined {
    return this.transactions.find(t => t.id === id);
  }

  private updateTransaction(transaction: BlockchainTransaction): void {
    const index = this.transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      this.transactions[index] = transaction;
    } else {
      this.transactions.push(transaction);
    }
  }

  // Wallet Management
  public async connectWallet(network: 'ethereum' | 'solana' | 'polygon'): Promise<WalletInfo> {
    const walletInfo: WalletInfo = {
      address: `0x${this.generateId()}${this.generateId()}`,
      balance: {
        DOJO: Math.random() * 10000,
        ETH: Math.random() * 10,
        SOL: Math.random() * 100
      },
      isConnected: true,
      network,
      lastSync: new Date()
    };

    this.wallets.set(walletInfo.address, walletInfo);
    this.socket?.emit('blockchain:wallet_connected', walletInfo);

    return walletInfo;
  }

  public async disconnectWallet(address: string): Promise<void> {
    const wallet = this.wallets.get(address);
    if (wallet) {
      wallet.isConnected = false;
      this.socket?.emit('blockchain:wallet_disconnected', wallet);
    }
  }

  public getWallets(): WalletInfo[] {
    return Array.from(this.wallets.values());
  }

  public getWalletByAddress(address: string): WalletInfo | undefined {
    return this.wallets.get(address);
  }

  private updateWallet(wallet: WalletInfo): void {
    this.wallets.set(wallet.address, wallet);
  }

  // Smart Contract Management
  public async deployContract(contract: Omit<SmartContract, 'address' | 'lastUpdate'>): Promise<SmartContract> {
    const newContract: SmartContract = {
      ...contract,
      address: `0x${this.generateId()}${this.generateId()}`,
      lastUpdate: new Date()
    };

    this.smartContracts.push(newContract);
    this.socket?.emit('blockchain:contract_deployed', newContract);

    return newContract;
  }

  public getContracts(): SmartContract[] {
    return [...this.smartContracts];
  }

  public getContractByAddress(address: string): SmartContract | undefined {
    return this.smartContracts.find(c => c.address === address);
  }

  // NFT Management
  public async mintNFT(metadata: Omit<NFTMetadata, 'tokenId' | 'mintDate'>): Promise<NFTMetadata> {
    const newNFT: NFTMetadata = {
      ...metadata,
      tokenId: this.generateId(),
      mintDate: new Date()
    };

    this.nfts.push(newNFT);
    this.socket?.emit('blockchain:nft_minted', newNFT);

    return newNFT;
  }

  public getNFTs(): NFTMetadata[] {
    return [...this.nfts];
  }

  public getNFTByTokenId(tokenId: string): NFTMetadata | undefined {
    return this.nfts.find(nft => nft.tokenId === tokenId);
  }

  private addNFT(nft: NFTMetadata): void {
    const existingIndex = this.nfts.findIndex(n => n.tokenId === nft.tokenId);
    if (existingIndex !== -1) {
      this.nfts[existingIndex] = nft;
    } else {
      this.nfts.push(nft);
    }
  }

  // DeFi Pool Management
  public async createDeFiPool(pool: Omit<DeFiPool, 'id' | 'lastUpdate'>): Promise<DeFiPool> {
    const newPool: DeFiPool = {
      ...pool,
      id: this.generateId(),
      lastUpdate: new Date()
    };

    this.defiPools.push(newPool);
    this.socket?.emit('blockchain:defi_pool_created', newPool);

    return newPool;
  }

  public getDeFiPools(): DeFiPool[] {
    return [...this.defiPools];
  }

  public getDeFiPoolById(id: string): DeFiPool | undefined {
    return this.defiPools.find(pool => pool.id === id);
  }

  private updateDeFiPool(pool: DeFiPool): void {
    const index = this.defiPools.findIndex(p => p.id === pool.id);
    if (index !== -1) {
      this.defiPools[index] = pool;
    } else {
      this.defiPools.push(pool);
    }
  }

  // Gas Price Management
  public getGasPrice(network: string): number {
    return this.gasPrices[network] || 20;
  }

  private updateGasPrice(network: string, price: number): void {
    this.gasPrices[network] = price;
  }

  // Utility Methods
  public isOnline(): boolean {
    return this.isConnected;
  }

  public getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  public getConfig() {
    return { ...this.config };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private loadMockData(): void {
    // Mock transactions
    const mockTransactions: BlockchainTransaction[] = [
      {
        id: 'tx1',
        type: 'entry_fee',
        amount: 100,
        currency: 'DOJO',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        status: 'confirmed',
        timestamp: new Date(Date.now() - 3600000),
        tournamentId: 'tournament1',
        playerId: 'player1',
        gasFee: 0.005,
        blockNumber: 1234567,
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      },
      {
        id: 'tx2',
        type: 'prize_payout',
        amount: 500,
        currency: 'DOJO',
        from: '0x0987654321098765432109876543210987654321',
        to: '0x1234567890123456789012345678901234567890',
        status: 'pending',
        timestamp: new Date(Date.now() - 1800000),
        tournamentId: 'tournament1',
        playerId: 'player2',
        gasFee: 0.008
      }
    ];

    this.transactions = mockTransactions;

    // Mock smart contracts
    this.smartContracts = [
      {
        address: this.config.contracts.dojoToken,
        name: 'DojoCoin',
        type: 'token',
        network: 'ethereum',
        functions: ['transfer', 'approve', 'balanceOf', 'totalSupply'],
        events: ['Transfer', 'Approval'],
        lastUpdate: new Date()
      },
      {
        address: this.config.contracts.tournamentFactory,
        name: 'TournamentFactory',
        type: 'tournament',
        network: 'ethereum',
        functions: ['createTournament', 'joinTournament', 'distributePrizes'],
        events: ['TournamentCreated', 'PlayerJoined', 'PrizeDistributed'],
        lastUpdate: new Date()
      }
    ];

    // Mock NFTs
    this.nfts = [
      {
        tokenId: '1',
        name: 'Tournament Champion #1',
        description: 'Awarded to the winner of the first DojoPool tournament',
        image: '/images/nft-champion-1.png',
        attributes: [
          { trait_type: 'Rarity', value: 'Legendary' },
          { trait_type: 'Tournament', value: 'DojoPool Championship 2024' },
          { trait_type: 'Position', value: '1st Place' }
        ],
        tournamentId: 'tournament1',
        playerId: 'player1',
        rarity: 'legendary',
        mintDate: new Date(Date.now() - 86400000)
      }
    ];

    // Mock DeFi pools
    this.defiPools = [
      {
        id: 'pool1',
        name: 'DOJO-ETH Pool',
        tokens: ['DOJO', 'ETH'],
        liquidity: 1000000,
        volume24h: 50000,
        apy: 12.5,
        tvl: 2500000,
        lastUpdate: new Date()
      }
    ];

    // Mock gas prices
    this.gasPrices = {
      ethereum: 25,
      solana: 0.000005,
      polygon: 30
    };
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export default TournamentBlockchainService; 
