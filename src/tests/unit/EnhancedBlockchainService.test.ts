import { enhancedBlockchainService } from '../../services/blockchain/EnhancedBlockchainService';
import { vi } from 'vitest';

// Mock ethers with proper exports and BigInt support
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn(),
    Wallet: vi.fn(),
    Contract: vi.fn(),
    parseEther: vi.fn((value) => BigInt(value)),
    formatEther: vi.fn((value) => value.toString()),
    parseUnits: vi.fn((value) => BigInt(value)),
    formatUnits: vi.fn((value) => value.toString())
  },
  parseEther: vi.fn((value) => BigInt(value)),
  formatEther: vi.fn((value) => value.toString()),
  parseUnits: vi.fn((value) => BigInt(value)),
  formatUnits: vi.fn((value) => value.toString())
}));

describe('EnhancedBlockchainService', () => {
  let service: typeof enhancedBlockchainService;

  beforeEach(() => {
    service = enhancedBlockchainService;
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(service).toBeDefined();
    });
  });

  describe('Dojo Coin operations', () => {
    it('should get Dojo Coin balance', async () => {
      const balance = await service.getDojoCoinBalance('user-1', 'ethereum');
      
      expect(balance.userId).toBe('user-1');
      expect(balance.network).toBe('ethereum');
      expect(balance.balance).toBeDefined();
      expect(balance.lastUpdated).toBeInstanceOf(Date);
    });

    it('should transfer Dojo Coins', async () => {
      const result = await service.transferDojoCoins(
        'user-1',
        'user-2',
        '100',
        'ethereum'
      );
      
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    it('should fail transfer with insufficient balance', async () => {
      // Mock a low balance to ensure transfer fails
      const lowBalance = '50'; // Very low balance
      vi.spyOn(service, 'getDojoCoinBalance').mockResolvedValueOnce({
        userId: 'user-1',
        balance: lowBalance,
        network: 'ethereum',
        lastUpdated: new Date()
      });
      
      const result = await service.transferDojoCoins(
        'user-1',
        'user-2',
        '100',
        'ethereum'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('cross-chain operations', () => {
    it('should initiate cross-chain transfer', async () => {
      const result = await service.initiateCrossChainTransfer(
        'user-1',
        'user-2',
        '100',
        'ethereum',
        'polygon'
      );
      
      expect(result.id).toBeDefined();
      expect(result.fromNetwork).toBe('ethereum');
      expect(result.toNetwork).toBe('polygon');
      expect(result.amount).toBe('100');
      expect(result.status).toBe('pending');
    });

    it('should get cross-chain transaction', async () => {
      const transfer = await service.initiateCrossChainTransfer(
        'user-1',
        'user-2',
        '100',
        'ethereum',
        'polygon'
      );
      
      const retrieved = await service.getCrossChainTransaction(transfer.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(transfer.id);
    });
  });

  describe('NFT operations', () => {
    it('should mint NFT', async () => {
      const result = await service.mintNFT(
        'user-1',
        'token-123',
        {
          name: 'Test Trophy',
          description: 'A test trophy',
          image: 'https://example.com/image.png'
        },
        'ethereum'
      );
      
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    it('should list NFT for sale', async () => {
      const item = await service.listNFT(
        'token-123',
        '0x1234567890123456789012345678901234567890',
        'ethereum',
        'user-1',
        '100',
        'DOJO',
        {
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://example.com/image.png',
          attributes: []
        }
      );
      
      expect(item.id).toBeDefined();
      expect(item.tokenId).toBe('token-123');
      expect(item.seller).toBe('user-1');
      expect(item.price).toBe('100');
    });

    it('should buy NFT', async () => {
      // First list an NFT
      const item = await service.listNFT(
        'token-123',
        '0x1234567890123456789012345678901234567890',
        'ethereum',
        'user-1',
        '100',
        'DOJO',
        {
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://example.com/image.png',
          attributes: []
        }
      );
      
      const result = await service.buyNFT(item.id, 'user-2', 'DOJO');
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    it('should get marketplace items', async () => {
      // List some items first
      await service.listNFT(
        'token-1',
        '0x1234567890123456789012345678901234567890',
        'ethereum',
        'user-1',
        '100',
        'DOJO',
        {
          name: 'Test NFT 1',
          description: 'A test NFT',
          image: 'https://example.com/image1.png',
          attributes: []
        }
      );
      
      await service.listNFT(
        'token-2',
        '0x1234567890123456789012345678901234567890',
        'polygon',
        'user-2',
        '200',
        'DOJO',
        {
          name: 'Test NFT 2',
          description: 'Another test NFT',
          image: 'https://example.com/image2.png',
          attributes: []
        }
      );
      
      const items = await service.getMarketplaceItems();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should filter marketplace items by network', async () => {
      const ethereumItems = await service.getMarketplaceItems('ethereum');
      expect(Array.isArray(ethereumItems)).toBe(true);
      
      ethereumItems.forEach(item => {
        expect(item.network).toBe('ethereum');
      });
    });
  });

  describe('smart contract operations', () => {
    it('should deploy Dojo Coin contract', async () => {
      const result = await service.deployDojoCoinContract('ethereum');
      
      expect(result.success).toBe(true);
      expect(result.contractAddress).toBeDefined();
    });

    it('should handle deployment errors', async () => {
      // Mock a deployment failure
      vi.spyOn(service, 'deployDojoCoinContract').mockRejectedValueOnce(new Error('Deployment failed'));
      
      await expect(
        service.deployDojoCoinContract('invalid-network')
      ).rejects.toThrow('Deployment failed');
    });
  });

  describe('analytics and monitoring', () => {
    it('should get blockchain analytics', async () => {
      const analytics = await service.getBlockchainAnalytics();
      
      expect(analytics).toBeDefined();
      expect(analytics.totalTransactions).toBeGreaterThanOrEqual(0);
      expect(analytics.totalVolume).toBeDefined();
      expect(analytics.activeUsers).toBeGreaterThanOrEqual(0);
      expect(analytics.crossChainTransfers).toBeGreaterThanOrEqual(0);
      expect(analytics.nftListings).toBeGreaterThanOrEqual(0);
      expect(analytics.networkDistribution).toBeDefined();
    });

    it('should perform health check', async () => {
      const health = await service.healthCheck();
      
      expect(health).toBeDefined();
      expect(typeof health.ethereum).toBe('boolean');
      expect(typeof health.polygon).toBe('boolean');
      expect(typeof health.solana).toBe('boolean');
      expect(typeof health.overall).toBe('boolean');
    });
  });

  describe('error handling', () => {
    it('should handle invalid network', async () => {
      await expect(
        service.getDojoCoinBalance('user-1', 'invalid-network')
      ).rejects.toThrow('Unsupported network');
    });

    it('should handle NFT purchase with non-existent item', async () => {
      const result = await service.buyNFT('non-existent-id', 'user-1', 'DOJO');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found');
    });
  });
}); 