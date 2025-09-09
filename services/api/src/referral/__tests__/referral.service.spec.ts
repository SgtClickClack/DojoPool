import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EconomyService } from '../../economy/economy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReferralService } from '../referral.service';

describe('ReferralService', () => {
  let service: ReferralService;
  let prismaService: PrismaService;
  let economyService: EconomyService;

  const mockPrismaService = {
    referral: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockEconomyService = {
    creditCoins: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EconomyService,
          useValue: mockEconomyService,
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    prismaService = module.get<PrismaService>(PrismaService);
    economyService = module.get<EconomyService>(EconomyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateReferralCode', () => {
    it('should return existing referral code', async () => {
      const mockReferral = {
        referralCode: 'ABC123',
        createdAt: new Date(),
      };

      mockPrismaService.referral.findFirst.mockResolvedValue(mockReferral);

      const result = await service.getOrCreateReferralCode('user-1');

      expect(result).toEqual({
        referralCode: 'ABC123',
        createdAt: mockReferral.createdAt,
      });
      expect(mockPrismaService.referral.findFirst).toHaveBeenCalledWith({
        where: {
          inviterId: 'user-1',
          inviteeId: null,
        },
      });
    });

    it('should create new referral code when none exists', async () => {
      const mockNewReferral = {
        referralCode: 'XYZ789',
        createdAt: new Date(),
      };

      mockPrismaService.referral.findFirst.mockResolvedValue(null);
      mockPrismaService.referral.create.mockResolvedValue(mockNewReferral);

      const result = await service.getOrCreateReferralCode('user-1');

      expect(result.referralCode).toBeDefined();
      expect(mockPrismaService.referral.create).toHaveBeenCalledWith({
        data: {
          referralCode: expect.any(String),
          inviterId: 'user-1',
          status: 'PENDING',
          rewardStatus: 'PENDING',
        },
      });
    });
  });

  describe('processReferralSignup', () => {
    it('should process referral signup successfully', async () => {
      const mockReferral = {
        id: 'ref-1',
        inviterId: 'inviter-1',
        inviteeId: null,
        rewardAmount: 100,
        inviteeReward: 50,
        inviter: { id: 'inviter-1' },
      };

      mockPrismaService.referral.findUnique.mockResolvedValue(mockReferral);
      mockPrismaService.referral.update.mockResolvedValue({
        ...mockReferral,
        inviteeId: 'new-user',
        status: 'COMPLETED',
        invitedAt: new Date(),
      });
      mockEconomyService.creditCoins.mockResolvedValue({});

      await service.processReferralSignup('new-user', 'ABC123');

      expect(mockPrismaService.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
        data: {
          inviteeId: 'new-user',
          status: 'COMPLETED',
          invitedAt: expect.any(Date),
        },
      });

      expect(mockEconomyService.creditCoins).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException for invalid referral code', async () => {
      mockPrismaService.referral.findUnique.mockResolvedValue(null);

      await expect(
        service.processReferralSignup('new-user', 'INVALID')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when code already used', async () => {
      const mockReferral = {
        inviteeId: 'existing-user',
      };

      mockPrismaService.referral.findUnique.mockResolvedValue(mockReferral);

      await expect(
        service.processReferralSignup('new-user', 'USED')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when using own referral code', async () => {
      const mockReferral = {
        inviterId: 'same-user',
      };

      mockPrismaService.referral.findUnique.mockResolvedValue(mockReferral);

      await expect(
        service.processReferralSignup('same-user', 'OWN')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getReferralStats', () => {
    it('should return correct referral statistics', async () => {
      const mockReferrals = [
        {
          status: 'COMPLETED',
          rewardStatus: 'CLAIMED',
          rewardAmount: 100,
        },
        {
          status: 'PENDING',
          rewardStatus: 'PENDING',
          rewardAmount: 100,
        },
        {
          status: 'COMPLETED',
          rewardStatus: 'CLAIMED',
          rewardAmount: 100,
        },
      ];

      mockPrismaService.referral.findMany.mockResolvedValue(mockReferrals);

      const result = await service.getReferralStats('user-1');

      expect(result).toEqual({
        totalReferrals: 3,
        completedReferrals: 2,
        pendingRewards: 1,
        claimedRewards: 2,
        totalEarned: 200,
      });
    });
  });

  describe('getReferralDetails', () => {
    it('should return detailed referral information', async () => {
      const mockReferrals = [
        {
          id: 'ref-1',
          referralCode: 'ABC123',
          inviteeId: 'user-2',
          status: 'COMPLETED',
          rewardStatus: 'CLAIMED',
          rewardAmount: 100,
          inviteeReward: 50,
          invitedAt: new Date(),
          rewardClaimedAt: new Date(),
          createdAt: new Date(),
          invitee: { username: 'user2' },
        },
      ];

      mockPrismaService.referral.findMany.mockResolvedValue(mockReferrals);

      const result = await service.getReferralDetails('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'ref-1',
        referralCode: 'ABC123',
        inviteeId: 'user-2',
        inviteeUsername: 'user2',
        status: 'COMPLETED',
        rewardStatus: 'CLAIMED',
        rewardAmount: 100,
        inviteeReward: 50,
        invitedAt: expect.any(Date),
        rewardClaimedAt: expect.any(Date),
        createdAt: expect.any(Date),
      });
    });
  });

  describe('validateReferralCode', () => {
    it('should return true for valid unused code', async () => {
      const mockReferral = {
        inviteeId: null,
      };

      mockPrismaService.referral.findUnique.mockResolvedValue(mockReferral);

      const result = await service.validateReferralCode('VALID');

      expect(result).toBe(true);
    });

    it('should return false for used code', async () => {
      const mockReferral = {
        inviteeId: 'user-2',
      };

      mockPrismaService.referral.findUnique.mockResolvedValue(mockReferral);

      const result = await service.validateReferralCode('USED');

      expect(result).toBe(false);
    });

    it('should return false for non-existent code', async () => {
      mockPrismaService.referral.findUnique.mockResolvedValue(null);

      const result = await service.validateReferralCode('INVALID');

      expect(result).toBe(false);
    });
  });
});
