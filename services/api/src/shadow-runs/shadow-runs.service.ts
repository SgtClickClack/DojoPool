import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShadowRunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  private getRunCost(type: string): number {
    const base = type === 'DATA_HEIST' ? 50 : 75;
    return base;
  }

  private simulateOutcome(
    defenseLevel: number,
    type: string
  ): { success: boolean; roll: number; threshold: number } {
    // Simple probability: success chance decreases with defenseLevel
    // Baseline 70% minus 10% per defense level, min 10%, max 90%
    const base = type === 'DATA_HEIST' ? 0.7 : 0.6;
    const successChance = Math.min(
      0.9,
      Math.max(0.1, base - 0.1 * (defenseLevel - 1))
    );
    const roll = Math.random();
    return { success: roll < successChance, roll, threshold: successChance };
  }

  async initiateRun(userId: string, targetVenueId: string, runType: string) {
    const type = runType;
    const cost = this.getRunCost(type);

    return this.prisma.$transaction(async (tx) => {
      // Determine initiating clan: prefer a clan where user is leader, else first membership
      const leaderClan = await tx.clan.findFirst({
        where: { leaderId: userId },
      });
      let initiatingClan = leaderClan;
      if (!initiatingClan) {
        const membership = await tx.clanMember.findFirst({
          where: { userId: userId },
          include: { clan: true },
        });
        initiatingClan = membership?.clan ?? null;
      }
      if (!initiatingClan)
        throw new BadRequestException('User is not in a clan');

      const venue = await tx.venue.findUnique({ where: { id: targetVenueId } });
      if (!venue) throw new NotFoundException('Target venue not found');

      if (initiatingClan.dojoCoinBalance < cost) {
        throw new ConflictException(
          'Insufficient DojoCoins to initiate shadow run'
        );
      }

      // Deduct cost first
      await tx.clan.update({
        where: { id: initiatingClan.id },
        data: { dojoCoinBalance: { decrement: cost } },
      });

      // Create initial record
      const run = await tx.shadowRun.create({
        data: {
          playerId: userId,
          initiatingClanId: initiatingClan.id,
          targetVenueId,
          type,
          status: 'PENDING',
          cost,
        },
      });

      // Simulate resolution
      const sim = this.simulateOutcome(venue.defenseLevel ?? 1, type);
      let status: string = sim.success ? 'SUCCESS' : 'FAILED';
      const outcome: Prisma.JsonObject = {
        runId: run.id,
        type,
        success: sim.success,
        roll: sim.roll,
        threshold: sim.threshold,
        venueId: venue.id,
      } as any;

      // Apply effects
      let transfer = 0;
      if (sim.success && type === 'DATA_HEIST') {
        // Transfer small amount from venue's controlling clan if exists; else mint from system (0)
        const targetClanId = venue.controllingClanId ?? null;
        const heistAmount = 25; // small number of coins
        if (targetClanId) {
          const targetClan = await tx.clan.findUnique({
            where: { id: targetClanId },
          });
          if (targetClan) {
            const actual = Math.min(
              heistAmount,
              Math.max(0, targetClan.dojoCoinBalance)
            );
            transfer = actual;
            if (actual > 0) {
              await tx.clan.update({
                where: { id: targetClan.id },
                data: { dojoCoinBalance: { decrement: actual } },
              });
              await tx.clan.update({
                where: { id: initiatingClan.id },
                data: { dojoCoinBalance: { increment: actual } },
              });
            }
          }
        }
        (outcome as any).heistAmount = transfer;
      }

      // Update run with final status and outcome
      const finalized = await tx.shadowRun.update({
        where: { id: run.id },
        data: { status, outcome: outcome as any },
      });

      // Notify leaders of both clans if possible
      const attackerLeaderId = initiatingClan.leaderId;
      try {
        await this.notifications.createNotification(
          attackerLeaderId,
          'CLAN_WAR_UPDATE' as any,
          sim.success
            ? `Shadow run ${type} succeeded against venue ${venue.name}.`
            : `Shadow run ${type} failed against venue ${venue.name}.`,
          { runId: finalized.id, venueId: venue.id, transfer }
        );
      } catch {}

      if (venue.controllingClanId) {
        const defendingClan = await tx.clan.findUnique({
          where: { id: venue.controllingClanId },
        });
        if (defendingClan) {
          try {
            await this.notifications.createNotification(
              defendingClan.leaderId,
              'CLAN_WAR_UPDATE' as any,
              sim.success
                ? `A shadow run ${type} succeeded against your venue ${venue.name}.`
                : `A shadow run ${type} failed against your venue ${venue.name}.`,
              { runId: finalized.id, venueId: venue.id, transfer }
            );
          } catch {}
        }
      }

      return finalized;
    });
  }

  async getRunsForClan(clanId: string) {
    return this.prisma.shadowRun.findMany({
      where: {
        OR: [
          { initiatingClanId: clanId },
          { targetVenue: { controllingClanId: clanId } },
        ],
      },
      include: {
        initiatingClan: { select: { name: true } },
        targetVenue: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
