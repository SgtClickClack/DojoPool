import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TradeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TradingService } from './trading.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
  trade: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  userAvatarAsset: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('TradingService', () => {
  let service: TradingService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TradingService>(TradingService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('proposeTrade', () => {
    const mockProposal = {
      proposerId: 'user1',
      recipientId: 'user2',
      proposerItems: [{ assetId: 'asset1', type: 'AVATAR_ASSET' }],
      proposerCoins: 100,
      recipientItems: [],
      recipientCoins: 50,
      message: 'Great trade!',
      expiresInHours: 24,
    };

    it('should create a trade proposal successfully', async () => {
      const mockUsers = {
        proposer: { id: 'user1', username: 'Proposer', dojoCoinBalance: 200 },
        recipient: { id: 'user2', username: 'Recipient', dojoCoinBalance: 100 },
      };

      mockPrismaService.user.findUnique.mockImplementation((args) => {
        if (args.where.id === 'user1')
          return Promise.resolve(mockUsers.proposer);
        if (args.where.id === 'user2')
          return Promise.resolve(mockUsers.recipient);
        return Promise.resolve(null);
      });

      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue({
        userId: 'user1',
        assetId: 'asset1',
      });

      const mockTrade = {
        id: 'trade1',
        ...mockProposal,
        status: TradeStatus.PENDING,
      };
      mockPrismaService.trade.create.mockResolvedValue(mockTrade);

      const result = await service.proposeTrade(mockProposal);

      expect(result).toEqual(mockTrade);
      expect(mockPrismaService.trade.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          proposerId: 'user1',
          recipientId: 'user2',
          proposerCoins: 100,
          recipientCoins: 50,
          message: 'Great trade!',
          status: TradeStatus.PENDING,
        }),
      });
    });

    it('should throw NotFoundException if proposer does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.proposeTrade(mockProposal)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if proposer has insufficient DojoCoins', async () => {
      const mockUsers = {
        proposer: { id: 'user1', username: 'Proposer', dojoCoinBalance: 50 },
        recipient: { id: 'user2', username: 'Recipient', dojoCoinBalance: 100 },
      };

      mockPrismaService.user.findUnique.mockImplementation((args) => {
        if (args.where.id === 'user1')
          return Promise.resolve(mockUsers.proposer);
        if (args.where.id === 'user2')
          return Promise.resolve(mockUsers.recipient);
        return Promise.resolve(null);
      });

      await expect(service.proposeTrade(mockProposal)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if proposer does not own the asset', async () => {
      const mockUsers = {
        proposer: { id: 'user1', username: 'Proposer', dojoCoinBalance: 200 },
        recipient: { id: 'user2', username: 'Recipient', dojoCoinBalance: 100 },
      };

      mockPrismaService.user.findUnique.mockImplementation((args) => {
        if (args.where.id === 'user1')
          return Promise.resolve(mockUsers.proposer);
        if (args.where.id === 'user2')
          return Promise.resolve(mockUsers.recipient);
        return Promise.resolve(null);
      });

      mockPrismaService.userAvatarAsset.findUnique.mockResolvedValue(null);

      await expect(service.proposeTrade(mockProposal)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('respondToTrade', () => {
    const mockTrade = {
      id: 'trade1',
      proposerId: 'user1',
      recipientId: 'user2',
      status: TradeStatus.PENDING,
      proposerCoins: 100,
      recipientCoins: 50,
      proposerItems: JSON.stringify([
        { assetId: 'asset1', type: 'AVATAR_ASSET' },
      ]),
      recipientItems: JSON.stringify([]),
      proposer: { id: 'user1', username: 'Proposer' },
      recipient: { id: 'user2', username: 'Recipient' },
    };

    it('should accept trade successfully', async () => {
      const mockUsers = {
        proposer: { id: 'user1', username: 'Proposer', dojoCoinBalance: 200 },
        recipient: { id: 'user2', username: 'Recipient', dojoCoinBalance: 100 },
      };

      mockPrismaService.trade.findUnique.mockResolvedValue(mockTrade);
      mockPrismaService.user.findUnique.mockImplementation((args) => {
        if (args.where.id === 'user1')
          return Promise.resolve(mockUsers.proposer);
        if (args.where.id === 'user2')
          return Promise.resolve(mockUsers.recipient);
        return Promise.resolve(null);
      });

      const mockTransaction = {
        $transaction: jest
          .fn()
          .mockImplementation((callback) => callback(mockPrismaService)),
      };
      mockPrismaService.$transaction = mockTransaction.$transaction;

      const acceptedTrade = { ...mockTrade, status: TradeStatus.ACCEPTED };
      mockPrismaService.trade.update.mockResolvedValue(acceptedTrade);

      const result = await service.respondToTrade({
        tradeId: 'trade1',
        userId: 'user2',
        accept: true,
      });

      expect(result.status).toBe(TradeStatus.ACCEPTED);
    });

    it('should reject trade successfully', async () => {
      mockPrismaService.trade.findUnique.mockResolvedValue(mockTrade);
      const rejectedTrade = { ...mockTrade, status: TradeStatus.REJECTED };
      mockPrismaService.trade.update.mockResolvedValue(rejectedTrade);

      const result = await service.respondToTrade({
        tradeId: 'trade1',
        userId: 'user2',
        accept: false,
      });

      expect(result.status).toBe(TradeStatus.REJECTED);
    });

    it('should throw ForbiddenException if user is not the recipient', async () => {
      mockPrismaService.trade.findUnique.mockResolvedValue(mockTrade);

      await expect(
        service.respondToTrade({
          tradeId: 'trade1',
          userId: 'user1', // Wrong user
          accept: true,
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if trade is not pending', async () => {
      const completedTrade = { ...mockTrade, status: TradeStatus.ACCEPTED };
      mockPrismaService.trade.findUnique.mockResolvedValue(completedTrade);

      await expect(
        service.respondToTrade({
          tradeId: 'trade1',
          userId: 'user2',
          accept: true,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingTrades', () => {
    it('should return pending trades for user', async () => {
      const mockTrades = [
        {
          id: 'trade1',
          proposerId: 'user1',
          recipientId: 'user2',
          status: TradeStatus.PENDING,
          proposer: { id: 'user1', username: 'Proposer', avatarUrl: null },
          recipient: { id: 'user2', username: 'Recipient', avatarUrl: null },
        },
      ];

      mockPrismaService.trade.findMany.mockResolvedValue(mockTrades);

      const result = await service.getPendingTrades('user1');

      expect(result).toEqual(mockTrades);
      expect(mockPrismaService.trade.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { proposerId: 'user1', status: TradeStatus.PENDING },
            { recipientId: 'user1', status: TradeStatus.PENDING },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('cancelTrade', () => {
    it('should cancel trade successfully', async () => {
      const mockTrade = {
        id: 'trade1',
        proposerId: 'user1',
        status: TradeStatus.PENDING,
      };

      mockPrismaService.trade.findUnique.mockResolvedValue(mockTrade);
      const cancelledTrade = { ...mockTrade, status: TradeStatus.CANCELLED };
      mockPrismaService.trade.update.mockResolvedValue(cancelledTrade);

      const result = await service.cancelTrade('trade1', 'user1');

      expect(result.status).toBe(TradeStatus.CANCELLED);
    });

    it('should throw ForbiddenException if user is not the proposer', async () => {
      const mockTrade = {
        id: 'trade1',
        proposerId: 'user1',
        status: TradeStatus.PENDING,
      };

      mockPrismaService.trade.findUnique.mockResolvedValue(mockTrade);

      await expect(service.cancelTrade('trade1', 'user2')).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
