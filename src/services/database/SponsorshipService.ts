import { PrismaClient } from "@prisma/client";
import { 
  SponsorshipBracket, 
  PlayerSponsorshipProgress, 
  SponsorshipEvent,
  SponsorshipStats,
  SponsorshipEventType 
} from "../../types/sponsorship";

const prisma = new PrismaClient();

export class SponsorshipService {
  // Bracket Management
  static async createBracket(bracketData: Omit<SponsorshipBracket, 'createdAt' | 'updatedAt'>): Promise<SponsorshipBracket> {
    try {
      const bracket = await prisma.sponsorshipBracket.create({
        data: {
          bracketId: bracketData.bracketId,
          sponsorName: bracketData.sponsorName,
          sponsorLogo: bracketData.sponsorLogo,
          inGameTitle: bracketData.inGameTitle,
          requiredLevel: bracketData.requiredLevel,
          narrativeIntro: bracketData.narrativeIntro,
          narrativeOutro: bracketData.narrativeOutro,
          challenges: bracketData.challenges as any,
          digitalReward: bracketData.digitalReward as any,
          physicalReward: bracketData.physicalReward as any,
          isActive: bracketData.isActive,
          startDate: bracketData.startDate ? new Date(bracketData.startDate) : null,
          endDate: bracketData.endDate ? new Date(bracketData.endDate) : null,
          maxParticipants: bracketData.maxParticipants,
          currentParticipants: bracketData.currentParticipants || 0,
        },
      });
      
      return {
        ...bracket,
        challenges: bracket.challenges as any,
        digitalReward: bracket.digitalReward as any,
        physicalReward: bracket.physicalReward as any,
        startDate: bracket.startDate?.toISOString(),
        endDate: bracket.endDate?.toISOString(),
        createdAt: bracket.createdAt.toISOString(),
        updatedAt: bracket.updatedAt.toISOString(),
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  static async getBracket(bracketId: string): Promise<SponsorshipBracket | null> {
    try {
      const bracket = await prisma.sponsorshipBracket.findUnique({
        where: { bracketId },
      });
      
      if (!bracket) return null;
      
      return {
        ...bracket,
        challenges: bracket.challenges as any,
        digitalReward: bracket.digitalReward as any,
        physicalReward: bracket.physicalReward as any,
        startDate: bracket.startDate?.toISOString(),
        endDate: bracket.endDate?.toISOString(),
        createdAt: bracket.createdAt.toISOString(),
        updatedAt: bracket.updatedAt.toISOString(),
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  static async getActiveBrackets(): Promise<SponsorshipBracket[]> {
    try {
      const brackets = await prisma.sponsorshipBracket.findMany({
        where: { 
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return brackets.map((bracket: any) => ({
        ...bracket,
        challenges: bracket.challenges as any,
        digitalReward: bracket.digitalReward as any,
        physicalReward: bracket.physicalReward as any,
        startDate: bracket.startDate?.toISOString(),
        endDate: bracket.endDate?.toISOString(),
        createdAt: bracket.createdAt.toISOString(),
        updatedAt: bracket.updatedAt.toISOString(),
      }));
    } finally {
      await prisma.$disconnect();
    }
  }

  static async updateBracket(bracketId: string, updates: Partial<SponsorshipBracket>): Promise<SponsorshipBracket> {
    try {
      const bracket = await prisma.sponsorshipBracket.update({
        where: { bracketId },
        data: {
          ...updates,
          startDate: updates.startDate ? new Date(updates.startDate) : undefined,
          endDate: updates.endDate ? new Date(updates.endDate) : undefined,
          updatedAt: new Date(),
        },
      });
      
      return {
        ...bracket,
        challenges: bracket.challenges as any,
        digitalReward: bracket.digitalReward as any,
        physicalReward: bracket.physicalReward as any,
        startDate: bracket.startDate?.toISOString(),
        endDate: bracket.endDate?.toISOString(),
        createdAt: bracket.createdAt.toISOString(),
        updatedAt: bracket.updatedAt.toISOString(),
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  // Player Progress Management
  static async getPlayerProgress(playerId: string): Promise<PlayerSponsorshipProgress[]> {
    try {
      const progress = await prisma.playerSponsorshipProgress.findMany({
        where: { playerId },
        include: { bracket: true },
        orderBy: { createdAt: 'desc' },
      });
      
      return progress.map((p: any) => ({
        ...p,
        challengeProgress: p.challengeProgress as any,
        startedAt: p.startedAt?.toISOString(),
        completedAt: p.completedAt?.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));
    } finally {
      await prisma.$disconnect();
    }
  }

  static async getPlayerBracketProgress(playerId: string, bracketId: string): Promise<PlayerSponsorshipProgress | null> {
    try {
      const progress = await prisma.playerSponsorshipProgress.findUnique({
        where: { playerId_bracketId: { playerId, bracketId } },
      });
      
      if (!progress) return null;
      
      return {
        ...progress,
        challengeProgress: progress.challengeProgress as any,
        startedAt: progress.startedAt?.toISOString(),
        completedAt: progress.completedAt?.toISOString(),
        createdAt: progress.createdAt.toISOString(),
        updatedAt: progress.updatedAt.toISOString(),
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  static async unlockBracket(playerId: string, bracketId: string, bracketTitle: string): Promise<PlayerSponsorshipProgress> {
    try {
      const progress = await prisma.playerSponsorshipProgress.create({
        data: {
          playerId,
          bracketId,
          bracketTitle,
          status: 'unlocked',
          challengeProgress: {},
        },
      });
      
      // Log event
      await this.logEvent('bracket_unlocked', playerId, bracketId);
      
      return {
        ...progress,
        challengeProgress: progress.challengeProgress as any,
        startedAt: progress.startedAt?.toISOString(),
        completedAt: progress.completedAt?.toISOString(),
        createdAt: progress.createdAt.toISOString(),
        updatedAt: progress.updatedAt.toISOString(),
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  static async updateChallengeProgress(
    playerId: string, 
    bracketId: string, 
    challengeId: string, 
    progress: number, 
    isCompleted: boolean
  ): Promise<PlayerSponsorshipProgress> {
    try {
      const existingProgress = await prisma.playerSponsorshipProgress.findUnique({
        where: { playerId_bracketId: { playerId, bracketId } },
      });
      
      if (!existingProgress) {
        throw new Error('Player progress not found for this bracket');
      }
      
      const challengeProgress = existingProgress.challengeProgress as any;
      challengeProgress[challengeId] = {
        isCompleted,
        progress,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };
      
      // Check if bracket is completed
      const bracket = await this.getBracket(bracketId);
      let status = existingProgress.status;
      let completedAt = existingProgress.completedAt;
      
      if (bracket && bracket.challenges.every(c => challengeProgress[c.challengeId]?.isCompleted)) {
        status = 'completed';
        completedAt = new Date();
      } else if (status === 'unlocked') {
        status = 'in_progress';
      }
      
      const updated = await prisma.playerSponsorshipProgress.update({
        where: { playerId_bracketId: { playerId, bracketId } },
        data: {
          challengeProgress,
          status,
          completedAt,
          updatedAt: new Date(),
        },
      });
      
      // Log events
      if (isCompleted) {
        await this.logEvent('challenge_completed', playerId, bracketId, challengeId);
      }
      
      if (status === 'completed' && existingProgress.status !== 'completed') {
        await this.logEvent('bracket_completed', playerId, bracketId);
      }
      
      return {
        ...updated,
        challengeProgress: updated.challengeProgress as any,
        startedAt: updated.startedAt?.toISOString(),
        completedAt: updated.completedAt?.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  static async claimDigitalReward(playerId: string, bracketId: string): Promise<PlayerSponsorshipProgress> {
    try {
      const updated = await prisma.playerSponsorshipProgress.update({
        where: { playerId_bracketId: { playerId, bracketId } },
        data: {
          digitalRewardClaimed: true,
          updatedAt: new Date(),
        },
      });
      
      await this.logEvent('digital_reward_claimed', playerId, bracketId);
      
      return {
        ...updated,
        challengeProgress: updated.challengeProgress as any,
        startedAt: updated.startedAt?.toISOString(),
        completedAt: updated.completedAt?.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  static async redeemPhysicalReward(playerId: string, bracketId: string, redemptionCode: string): Promise<PlayerSponsorshipProgress> {
    try {
      const updated = await prisma.playerSponsorshipProgress.update({
        where: { playerId_bracketId: { playerId, bracketId } },
        data: {
          physicalRewardRedeemed: true,
          redemptionCode,
          status: 'redeemed',
          updatedAt: new Date(),
        },
      });
      
      await this.logEvent('physical_reward_redeemed', playerId, bracketId);
      
      return {
        ...updated,
        challengeProgress: updated.challengeProgress as any,
        startedAt: updated.startedAt?.toISOString(),
        completedAt: updated.completedAt?.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  // Statistics and Analytics
  static async getPlayerStats(playerId: string): Promise<SponsorshipStats> {
    try {
      const progress = await prisma.playerSponsorshipProgress.findMany({
        where: { playerId },
        include: { bracket: true },
      });
      
      const totalBrackets = progress.length;
             const activeBrackets = progress.filter((p: any) => p.bracket.isActive && p.status !== 'completed' && p.status !== 'redeemed').length;
       const completedBrackets = progress.filter((p: any) => p.status === 'completed' || p.status === 'redeemed').length;
       const unlockedBrackets = progress.filter((p: any) => p.status === 'unlocked' || p.status === 'in_progress').length;
       const totalRewardsEarned = progress.filter((p: any) => p.digitalRewardClaimed).length;
       const physicalRewardsRedeemed = progress.filter((p: any) => p.physicalRewardRedeemed).length;
      
      return {
        totalBrackets,
        activeBrackets,
        completedBrackets,
        unlockedBrackets,
        totalRewardsEarned,
        physicalRewardsRedeemed,
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  // Event Logging
  static async logEvent(
    eventType: SponsorshipEventType, 
    playerId: string, 
    bracketId: string, 
    challengeId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.sponsorshipEvent.create({
        data: {
          eventType,
          playerId,
          bracketId,
          challengeId,
          metadata,
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  // Admin Functions
  static async deactivateBracket(bracketId: string): Promise<SponsorshipBracket> {
    return this.updateBracket(bracketId, { isActive: false });
  }

  static async getBracketAnalytics(bracketId: string) {
    try {
      const bracket = await prisma.sponsorshipBracket.findUnique({
        where: { bracketId },
        include: {
          playerProgress: true,
        },
      });
      
      if (!bracket) return null;
      
      const totalPlayers = bracket.playerProgress.length;
             const completedPlayers = bracket.playerProgress.filter((p: any) => p.status === 'completed' || p.status === 'redeemed').length;
       const inProgressPlayers = bracket.playerProgress.filter((p: any) => p.status === 'in_progress').length;
       const digitalRewardsClaimed = bracket.playerProgress.filter((p: any) => p.digitalRewardClaimed).length;
       const physicalRewardsRedeemed = bracket.playerProgress.filter((p: any) => p.physicalRewardRedeemed).length;
      
      return {
        bracketId,
        totalPlayers,
        completedPlayers,
        inProgressPlayers,
        completionRate: totalPlayers > 0 ? (completedPlayers / totalPlayers) * 100 : 0,
        digitalRewardsClaimed,
        physicalRewardsRedeemed,
        redemptionRate: completedPlayers > 0 ? (physicalRewardsRedeemed / completedPlayers) * 100 : 0,
      };
    } finally {
      await prisma.$disconnect();
    }
  }
}