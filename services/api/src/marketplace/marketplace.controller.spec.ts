import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

const mockMarketplaceService = {
  listItems: jest.fn(),
  buyItem: jest.fn(),
  createClanListing: jest.fn(),
  getClanListings: jest.fn(),
  buyFromClanMarketplace: jest.fn(),
  depositToClanWallet: jest.fn(),
  withdrawFromClanWallet: jest.fn(),
  getClanWallet: jest.fn(),
};

describe('MarketplaceController', () => {
  let controller: MarketplaceController;
  let service: typeof mockMarketplaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketplaceController],
      providers: [
        {
          provide: MarketplaceService,
          useValue: mockMarketplaceService,
        },
      ],
    }).compile();

    controller = module.get<MarketplaceController>(MarketplaceController);
    service = module.get(MarketplaceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listItems', () => {
    it('should return marketplace items', async () => {
      const mockItems = [{ id: 'item1', name: 'Test Item' }];
      mockMarketplaceService.listItems.mockResolvedValue(mockItems);

      const result = await controller.listItems();

      expect(result).toEqual(mockItems);
      expect(mockMarketplaceService.listItems).toHaveBeenCalled();
    });
  });

  describe('buyItem', () => {
    it('should purchase marketplace item', async () => {
      const mockResult = { balance: 1500, inventoryItem: { id: 'inv1' } };
      const body = { userId: 'user1' };

      mockMarketplaceService.buyItem.mockResolvedValue(mockResult);

      const result = await controller.buyItem('item1', body);

      expect(result).toEqual(mockResult);
      expect(mockMarketplaceService.buyItem).toHaveBeenCalledWith(
        'user1',
        'item1'
      );
    });
  });

  describe('createClanListing', () => {
    it('should create clan marketplace listing', async () => {
      const listingData = {
        sellerId: 'user1',
        clanId: 'clan1',
        assetId: 'asset1',
        assetType: 'AVATAR_ASSET' as const,
        price: 100,
      };
      const mockListing = { id: 'listing1', ...listingData };

      mockMarketplaceService.createClanListing.mockResolvedValue(mockListing);

      const result = await controller.createClanListing(listingData);

      expect(result).toEqual(mockListing);
      expect(mockMarketplaceService.createClanListing).toHaveBeenCalledWith(
        listingData
      );
    });
  });

  describe('getClanListings', () => {
    it('should return clan marketplace listings', async () => {
      const mockListings = [
        {
          id: 'listing1',
          sellerId: 'user1',
          clanId: 'clan1',
          assetId: 'asset1',
          price: 100,
          seller: { id: 'user1', username: 'Seller' },
          clan: { id: 'clan1', name: 'Test Clan' },
        },
      ];

      mockMarketplaceService.getClanListings.mockResolvedValue(mockListings);

      const result = await controller.getClanListings('clan1');

      expect(result).toEqual(mockListings);
      expect(mockMarketplaceService.getClanListings).toHaveBeenCalledWith(
        'clan1'
      );
    });
  });

  describe('buyFromClanMarketplace', () => {
    it('should complete clan marketplace purchase', async () => {
      const buyData = {
        buyerId: 'user2',
        listingId: 'listing1',
        clanId: 'clan1',
      };
      const mockResult = {
        success: true,
        newBalance: 400,
        assetTransferred: true,
      };

      mockMarketplaceService.buyFromClanMarketplace.mockResolvedValue(
        mockResult
      );

      const result = await controller.buyFromClanMarketplace(buyData);

      expect(result).toEqual(mockResult);
      expect(
        mockMarketplaceService.buyFromClanMarketplace
      ).toHaveBeenCalledWith(buyData);
    });
  });

  describe('depositToClanWallet', () => {
    it('should deposit DojoCoins to clan wallet', async () => {
      const depositData = {
        userId: 'user1',
        clanId: 'clan1',
        amount: 100,
      };
      const mockResult = {
        success: true,
        newUserBalance: 900,
        newClanBalance: 100,
      };

      mockMarketplaceService.depositToClanWallet.mockResolvedValue(mockResult);

      const result = await controller.depositToClanWallet(depositData);

      expect(result).toEqual(mockResult);
      expect(mockMarketplaceService.depositToClanWallet).toHaveBeenCalledWith(
        depositData
      );
    });
  });

  describe('withdrawFromClanWallet', () => {
    it('should withdraw DojoCoins from clan wallet', async () => {
      const withdrawData = {
        userId: 'user1',
        clanId: 'clan1',
        amount: 50,
      };
      const mockResult = {
        success: true,
        newClanBalance: 450,
      };

      mockMarketplaceService.withdrawFromClanWallet.mockResolvedValue(
        mockResult
      );

      const result = await controller.withdrawFromClanWallet(withdrawData);

      expect(result).toEqual(mockResult);
      expect(
        mockMarketplaceService.withdrawFromClanWallet
      ).toHaveBeenCalledWith(withdrawData);
    });
  });

  describe('getClanWallet', () => {
    it('should return clan wallet information', async () => {
      const mockWallet = {
        id: 'wallet1',
        clanId: 'clan1',
        balance: 500,
        totalDeposits: 1000,
        totalWithdrawals: 500,
        clan: {
          id: 'clan1',
          name: 'Test Clan',
          leader: { id: 'leader1', username: 'Leader' },
        },
        transactions: [],
      };

      mockMarketplaceService.getClanWallet.mockResolvedValue(mockWallet);

      const result = await controller.getClanWallet('clan1');

      expect(result).toEqual(mockWallet);
      expect(mockMarketplaceService.getClanWallet).toHaveBeenCalledWith(
        'clan1'
      );
    });
  });
});
