import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClanTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MarketplaceService } from './marketplace.service';

const mockPrismaService = {
  clanMember: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userAvatarAsset: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  listing: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  clanWallet: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  clanTransaction: {
    create: jest.fn(),
  },
};

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createClanListing', () => {
    const mockListingData = {
      sellerId: 'user1',
      clanId: 'clan1',
      assetId: 'asset1',
      assetType: 'AVATAR_ASSET' as const,
      price: 100,
    };

    it('should create clan listing successfully', async () => {
      const mockMembership = {
        id: 'member1',
        clanId: 'clan1',
        userId: 'user1',
      };
      const mockAsset = { userId: 'user1', assetId: 'asset1' };
      const mockListing = {
        id: 'listing1',
        ...mockListingData,
        listingType: 'CLAN_MARKETPLACE',
      };

      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue(mockAsset);
      mockPrismaService.listing.create.mockResolvedValue(mockListing);

      const result = await service.createClanListing(mockListingData);

      expect(result).toEqual(mockListing);
      expect(mockPrismaService.listing.create).toHaveBeenCalledWith({
        data: {
          sellerId: 'user1',
          clanId: 'clan1',
          listingType: 'CLAN_MARKETPLACE',
          assetId: 'asset1',
          assetType: 'AVATAR_ASSET',
          price: 100,
        },
      });
    });

    it('should throw ForbiddenException if user is not clan member', async () => {
      mockPrismaService.clanMember.findUnique.mockResolvedValue(null);

      await expect(service.createClanListing(mockListingData)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw BadRequestException if user does not own the asset', async () => {
      const mockMembership = {
        id: 'member1',
        clanId: 'clan1',
        userId: 'user1',
      };

      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue(null);

      await expect(service.createClanListing(mockListingData)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getClanListings', () => {
    it('should return clan listings successfully', async () => {
      const mockListings = [
        {
          id: 'listing1',
          sellerId: 'user1',
          clanId: 'clan1',
          assetId: 'asset1',
          assetType: 'AVATAR_ASSET',
          price: 100,
          isActive: true,
          seller: { id: 'user1', username: 'Seller', avatarUrl: null },
          clan: { id: 'clan1', name: 'Test Clan', tag: 'TC' },
        },
      ];

      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

      const result = await service.getClanListings('clan1');

      expect(result).toEqual(mockListings);
      expect(mockPrismaService.listing.findMany).toHaveBeenCalledWith({
        where: {
          clanId: 'clan1',
          listingType: 'CLAN_MARKETPLACE',
          isActive: true,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('buyFromClanMarketplace', () => {
    const mockBuyData = {
      buyerId: 'user2',
      listingId: 'listing1',
      clanId: 'clan1',
    };

    it('should complete clan marketplace purchase successfully', async () => {
      const mockListing = {
        id: 'listing1',
        sellerId: 'user1',
        clanId: 'clan1',
        assetId: 'asset1',
        assetType: 'AVATAR_ASSET',
        price: 100,
        isActive: true,
      };
      const mockMembership = {
        id: 'member2',
        clanId: 'clan1',
        userId: 'user2',
        role: 'MEMBER',
      };
      const mockClanWallet = { id: 'wallet1', clanId: 'clan1', balance: 200 };

      mockPrismaService.listing.findUnique.mockResolvedValue(mockListing);
      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.clanWallet.findUnique.mockResolvedValue(mockClanWallet);

      const mockTransaction = {
        $transaction: jest
          .fn()
          .mockImplementation((callback) => callback(mockPrismaService)),
      };
      mockPrismaService.$transaction = mockTransaction.$transaction;

      const result = await service.buyFromClanMarketplace(mockBuyData);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(100);
      expect(mockPrismaService.clanWallet.update).toHaveBeenCalledWith({
        where: { clanId: 'clan1' },
        data: {
          balance: 100,
          totalWithdrawals: { increment: 100 },
        },
      });
    });

    it('should throw NotFoundException if listing does not exist', async () => {
      mockPrismaService.listing.findUnique.mockResolvedValue(null);

      await expect(service.buyFromClanMarketplace(mockBuyData)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if buyer is not clan member', async () => {
      const mockListing = {
        id: 'listing1',
        sellerId: 'user1',
        clanId: 'clan1',
        assetId: 'asset1',
        assetType: 'AVATAR_ASSET',
        price: 100,
        isActive: true,
      };

      mockPrismaService.listing.findUnique.mockResolvedValue(mockListing);
      mockPrismaService.clanMember.findUnique.mockResolvedValue(null);

      await expect(service.buyFromClanMarketplace(mockBuyData)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw BadRequestException if clan wallet has insufficient funds', async () => {
      const mockListing = {
        id: 'listing1',
        sellerId: 'user1',
        clanId: 'clan1',
        assetId: 'asset1',
        assetType: 'AVATAR_ASSET',
        price: 100,
        isActive: true,
      };
      const mockMembership = {
        id: 'member2',
        clanId: 'clan1',
        userId: 'user2',
        role: 'MEMBER',
      };
      const mockClanWallet = { id: 'wallet1', clanId: 'clan1', balance: 50 };

      mockPrismaService.listing.findUnique.mockResolvedValue(mockListing);
      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.clanWallet.findUnique.mockResolvedValue(mockClanWallet);

      await expect(service.buyFromClanMarketplace(mockBuyData)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('depositToClanWallet', () => {
    const mockDepositData = {
      userId: 'user1',
      clanId: 'clan1',
      amount: 100,
    };

    it('should deposit to clan wallet successfully', async () => {
      const mockMembership = {
        id: 'member1',
        clanId: 'clan1',
        userId: 'user1',
      };
      const mockUser = { id: 'user1', dojoCoinBalance: 200 };
      const mockClanWallet = { id: 'wallet1', clanId: 'clan1', balance: 50 };

      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.clanWallet.findUnique.mockResolvedValue(mockClanWallet);

      const mockTransaction = {
        $transaction: jest
          .fn()
          .mockImplementation((callback) => callback(mockPrismaService)),
      };
      mockPrismaService.$transaction = mockTransaction.$transaction;

      const result = await service.depositToClanWallet(mockDepositData);

      expect(result.success).toBe(true);
      expect(result.newUserBalance).toBe(100);
      expect(result.newClanBalance).toBe(150);
    });

    it('should create clan wallet if it does not exist', async () => {
      const mockMembership = {
        id: 'member1',
        clanId: 'clan1',
        userId: 'user1',
      };
      const mockUser = { id: 'user1', dojoCoinBalance: 200 };
      const newClanWallet = { id: 'wallet1', clanId: 'clan1', balance: 0 };

      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.clanWallet.findUnique.mockResolvedValue(null);
      mockPrismaService.clanWallet.create.mockResolvedValue(newClanWallet);

      const mockTransaction = {
        $transaction: jest
          .fn()
          .mockImplementation((callback) => callback(mockPrismaService)),
      };
      mockPrismaService.$transaction = mockTransaction.$transaction;

      const result = await service.depositToClanWallet(mockDepositData);

      expect(result.success).toBe(true);
      expect(mockPrismaService.clanWallet.create).toHaveBeenCalledWith({
        data: { clanId: 'clan1' },
      });
    });

    it('should throw BadRequestException if user has insufficient DojoCoins', async () => {
      const mockMembership = {
        id: 'member1',
        clanId: 'clan1',
        userId: 'user1',
      };
      const mockUser = { id: 'user1', dojoCoinBalance: 50 };

      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.depositToClanWallet(mockDepositData)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('withdrawFromClanWallet', () => {
    const mockWithdrawData = {
      userId: 'user1',
      clanId: 'clan1',
      amount: 100,
    };

    it('should withdraw from clan wallet successfully', async () => {
      const mockMembership = {
        id: 'member1',
        clanId: 'clan1',
        userId: 'user1',
        role: 'OFFICER',
      };
      const mockClanWallet = { id: 'wallet1', clanId: 'clan1', balance: 200 };

      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.clanWallet.findUnique.mockResolvedValue(mockClanWallet);

      const mockTransaction = {
        $transaction: jest
          .fn()
          .mockImplementation((callback) => callback(mockPrismaService)),
      };
      mockPrismaService.$transaction = mockTransaction.$transaction;

      const result = await service.withdrawFromClanWallet(mockWithdrawData);

      expect(result.success).toBe(true);
      expect(result.newClanBalance).toBe(100);
    });

    it('should throw ForbiddenException if user does not have withdrawal permissions', async () => {
      const mockMembership = {
        id: 'member1',
        clanId: 'clan1',
        userId: 'user1',
        role: 'MEMBER',
      };

      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);

      await expect(
        service.withdrawFromClanWallet(mockWithdrawData)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if clan wallet has insufficient funds', async () => {
      const mockMembership = {
        id: 'member1',
        clanId: 'clan1',
        userId: 'user1',
        role: 'OFFICER',
      };
      const mockClanWallet = { id: 'wallet1', clanId: 'clan1', balance: 50 };

      mockPrismaService.clanMember.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.clanWallet.findUnique.mockResolvedValue(mockClanWallet);

      await expect(
        service.withdrawFromClanWallet(mockWithdrawData)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getClanWallet', () => {
    it('should return clan wallet with transactions', async () => {
      const mockClanWallet = {
        id: 'wallet1',
        clanId: 'clan1',
        balance: 500,
        totalDeposits: 1000,
        totalWithdrawals: 500,
        clan: {
          id: 'clan1',
          name: 'Test Clan',
          tag: 'TC',
          leader: { id: 'leader1', username: 'Leader' },
        },
      };
      const mockTransactions = [
        {
          id: 'tx1',
          type: ClanTransactionType.DEPOSIT,
          amount: 100,
          description: 'Deposit',
          balanceAfter: 500,
          createdAt: new Date(),
          user: { id: 'user1', username: 'User1', avatarUrl: null },
        },
      ];

      mockPrismaService.clanWallet.findUnique.mockResolvedValue(mockClanWallet);
      mockPrismaService.clanTransaction.findMany.mockResolvedValue(
        mockTransactions
      );

      const result = await service.getClanWallet('clan1');

      expect(result).toEqual({
        ...mockClanWallet,
        transactions: mockTransactions,
      });
    });

    it('should return default wallet info if clan wallet does not exist', async () => {
      const mockClan = {
        id: 'clan1',
        name: 'Test Clan',
        tag: 'TC',
        leader: { id: 'leader1', username: 'Leader' },
      };

      mockPrismaService.clanWallet.findUnique.mockResolvedValue(null);
      mockPrismaService.clan.findUnique.mockResolvedValue(mockClan);

      const result = await service.getClanWallet('clan1');

      expect(result.clanId).toBe('clan1');
      expect(result.balance).toBe(0);
      expect(result.transactions).toEqual([]);
    });
  });
});
