import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { EconomyService } from '../economy.service';

describe('EconomyService', () => {
  let service: EconomyService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EconomyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EconomyService>(EconomyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return user balance successfully', async () => {
      const mockUser = {
        id: 'user-1',
        dojoCoinBalance: 1000,
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getBalance('user-1');

      expect(result).toEqual({
        userId: 'user-1',
        balance: 1000,
        lastUpdated: mockUser.updatedAt,
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          dojoCoinBalance: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getBalance('non-existent-user')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('processPurchase', () => {
    it('should process purchase successfully', async () => {
      const mockUser = {
        id: 'user-1',
        dojoCoinBalance: 500,
      };

      const mockTransaction = {
        id: 'txn-1',
      };

      const mockUpdatedUser = {
        dojoCoinBalance: 600,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
          user: { update: jest.fn().mockResolvedValue(mockUpdatedUser) },
        });
      });

      const result = await service.processPurchase({
        userId: 'user-1',
        amount: 100,
        paymentMethod: 'stripe',
      });

      expect(result).toEqual({
        transactionId: 'txn-1',
        amount: 100,
        newBalance: 600,
        status: 'COMPLETED',
      });
    });

    it('should throw BadRequestException for zero amount', async () => {
      await expect(
        service.processPurchase({
          userId: 'user-1',
          amount: 0,
          paymentMethod: 'stripe',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.processPurchase({
          userId: 'non-existent-user',
          amount: 100,
          paymentMethod: 'stripe',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('debitCoins', () => {
    it('should debit coins successfully', async () => {
      const mockUser = {
        dojoCoinBalance: 500,
      };

      const mockTransaction = {
        id: 'txn-1',
      };

      const mockUpdatedUser = {
        dojoCoinBalance: 400,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
          transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
          userUpdate: jest.fn().mockResolvedValue(mockUpdatedUser),
        });
      });

      const result = await service.debitCoins('user-1', 100, 'purchase');

      expect(result.transaction.id).toBe('txn-1');
      expect(result.newBalance).toBe(400);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const mockUser = {
        dojoCoinBalance: 50,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.debitCoins('user-1', 100, 'purchase')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('creditCoins', () => {
    it('should credit coins successfully', async () => {
      const mockUser = {
        dojoCoinBalance: 500,
      };

      const mockTransaction = {
        id: 'txn-1',
      };

      const mockUpdatedUser = {
        dojoCoinBalance: 600,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
          transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
          userUpdate: jest.fn().mockResolvedValue(mockUpdatedUser),
        });
      });

      const result = await service.creditCoins('user-1', 100, 'reward');

      expect(result.transaction.id).toBe('txn-1');
      expect(result.newBalance).toBe(600);
    });
  });

  describe('transferCoins', () => {
    it('should transfer coins successfully', async () => {
      const mockSender = { dojoCoinBalance: 500 };
      const mockReceiver = { id: 'user-2' };

      const mockFromTransaction = { id: 'txn-from' };
      const mockToTransaction = { id: 'txn-to' };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockSender) // sender balance check
        .mockResolvedValueOnce(mockReceiver); // receiver existence check

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: { findUnique: jest.fn() },
          transaction: { create: jest.fn() },
        });
      });

      const result = await service.transferCoins(
        'user-1',
        'user-2',
        100,
        'gift'
      );

      expect(result.fromTransaction.id).toBeDefined();
      expect(result.toTransaction.id).toBeDefined();
    });

    it('should throw BadRequestException when transferring to self', async () => {
      await expect(
        service.transferCoins('user-1', 'user-1', 100, 'gift')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          userId: 'user-1',
          amount: 100,
          currency: 'DOJO',
          type: 'CREDIT',
          metadata: {},
          createdAt: new Date(),
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions
      );

      const result = await service.getTransactionHistory('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('txn-1');
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });
  });
});
