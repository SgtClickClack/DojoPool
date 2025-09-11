import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ErrorUtils } from '../common';
import { EconomyService } from '../economy/economy.service';
import { PrismaService } from '../prisma/prisma.service';

export interface ReferralCodeResponse {
  referralCode: string;
  createdAt: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingRewards: number;
  claimedRewards: number;
  totalEarned: number;
}

export interface ReferralDetails {
  id: string;
  referralCode: string;
  inviteeId?: string;
  inviteeUsername?: string;
  status: string;
  rewardClaimed: boolean;
  createdAt: Date;
}

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private prisma: PrismaService,
    private economyService: EconomyService
  ) {}

  /**
   * Generate or retrieve referral code for user
   */
  async getOrCreateReferralCode(userId: string): Promise<ReferralCodeResponse> {
    try {
      // Check if user already has a referral code
      let referral = await this.prisma.referral.findFirst({
        where: {
          inviterId: userId,
          inviteeId: null, // This is the main referral code record
        },
      });

      if (referral) {
        return {
          referralCode: referral.code,
          createdAt: referral.createdAt,
        };
      }

      // Generate unique referral code
      const referralCode = await this.generateUniqueReferralCode();

      // Create referral record
      referral = await this.prisma.referral.create({
        data: {
          code: referralCode,
          inviterId: userId,
          // inviteeId will be set when someone uses the referral
          status: 'pending',
        },
      });

      this.logger.log(
        `Created referral code ${referralCode} for user ${userId}`
      );

      return {
        referralCode: referral.code,
        createdAt: referral.createdAt,
      };
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'get or create referral code',
          userId,
          err
        )
      );
      throw err;
    }
  }

  /**
   * Process referral during user signup
   */
  async processReferralSignup(
    newUserId: string,
    referralCode: string
  ): Promise<void> {
    try {
      // Find the referral by code
      const referral = await this.prisma.referral.findUnique({
        where: { code: referralCode },
        include: { inviter: true },
      });

      if (!referral) {
        throw new BadRequestException('Invalid referral code');
      }

      if (referral.inviteeId) {
        throw new BadRequestException('Referral code has already been used');
      }

      if (referral.inviterId === newUserId) {
        throw new BadRequestException('Cannot use your own referral code');
      }

      // Update referral with new user
      await this.prisma.referral.update({
        where: { id: referral.id },
        data: {
          inviteeId: newUserId,
          status: 'completed',
        },
      });

      // Credit rewards to both users
      await Promise.all([
        this.economyService.creditCoins(
          referral.inviterId,
          100, // Default referral reward
          `Referral reward for inviting ${newUserId}`,
          { referralId: referral.id, type: 'referral_inviter' }
        ),
        this.economyService.creditCoins(
          newUserId,
          50, // Default welcome bonus
          'Welcome bonus for using referral code',
          { referralId: referral.id, type: 'referral_invitee' }
        ),
      ]);

      // Update reward status
      await this.prisma.referral.update({
        where: { id: referral.id },
        data: {
          rewardClaimed: true,
        },
      });

      this.logger.log(
        `Referral processed: ${referral.inviterId} invited ${newUserId} with code ${referralCode}`
      );
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'process referral signup',
          `${newUserId} with code ${referralCode}`,
          err
        )
      );
      throw err;
    }
  }

  /**
   * Get referral statistics for user
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      const referrals = await this.prisma.referral.findMany({
        where: { inviterId: userId },
        include: { invitee: true },
      });

      const stats = referrals.reduce(
        (acc, referral) => {
          acc.totalReferrals++;

          if (referral.status === 'completed') {
            acc.completedReferrals++;
          }

          if (referral.rewardClaimed) {
            acc.claimedRewards++;
            acc.totalEarned += 100; // Default reward amount
          }

          return acc;
        },
        {
          totalReferrals: 0,
          completedReferrals: 0,
          pendingRewards: 0,
          claimedRewards: 0,
          totalEarned: 0,
        }
      );

      return stats;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('get referral stats', userId, err)
      );
      throw err;
    }
  }

  /**
   * Get detailed referral information for user
   */
  async getReferralDetails(userId: string): Promise<ReferralDetails[]> {
    try {
      const referrals = await this.prisma.referral.findMany({
        where: { inviterId: userId },
        include: {
          invitee: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return referrals.map((referral) => ({
        id: referral.id,
        referralCode: referral.code,
        inviteeId: referral.inviteeId || undefined,
        inviteeUsername: referral.invitee?.username || undefined,
        status: referral.status,
        rewardClaimed: referral.rewardClaimed,
        createdAt: referral.createdAt,
      }));
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('get referral details', userId, err)
      );
      throw err;
    }
  }

  /**
   * Validate referral code
   */
  async validateReferralCode(referralCode: string): Promise<boolean> {
    try {
      const referral = await this.prisma.referral.findUnique({
        where: { code: referralCode },
      });

      return !!referral && !referral.inviteeId;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'validate referral code',
          referralCode,
          err
        )
      );
      return false;
    }
  }

  /**
   * Generate unique referral code
   */
  private async generateUniqueReferralCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      attempts++;
    } while (
      attempts < maxAttempts &&
      (await this.prisma.referral.findUnique({ where: { code } }))
    );

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique referral code');
    }

    return code;
  }

  /**
   * Get referral by code (for public access)
   */
  async getReferralByCode(
    referralCode: string
  ): Promise<{ inviterId: string } | null> {
    try {
      const referral = await this.prisma.referral.findUnique({
        where: { code: referralCode },
        select: { inviterId: true },
      });

      return referral;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('get referral by code', referralCode, err)
      );
      return null;
    }
  }
}
