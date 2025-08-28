import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expirePendingChallenges() {
    const now = new Date();

    const result = await this.prisma.challenge.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          not: null,
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} challenge(s)`);
    }
  }

  // Passive Dojo income accrual (hourly)
  @Cron(CronExpression.EVERY_HOUR)
  async accrueDojoIncome() {
    const baseIncome = Number.parseInt(
      process.env.DOJO_BASE_INCOME || '10',
      10
    );
    try {
      const venues = await this.prisma.venue.findMany({
        where: { controllingClanId: { not: null } },
        select: { controllingClanId: true, incomeModifier: true },
      });

      if (!venues.length) return;

      const totals = new Map<string, number>();
      for (const v of venues) {
        if (!v.controllingClanId) continue;
        const amount = Math.max(
          0,
          Math.floor(baseIncome * (v.incomeModifier ?? 1))
        );
        if (amount <= 0) continue;
        totals.set(
          v.controllingClanId,
          (totals.get(v.controllingClanId) || 0) + amount
        );
      }

      if (totals.size === 0) return;

      const ops = Array.from(totals.entries()).map(([clanId, amount]) =>
        this.prisma.clan.update({
          where: { id: clanId },
          data: { dojoCoinBalance: { increment: amount } },
        })
      );

      await this.prisma.$transaction(ops);
      this.logger.log(
        `Accrued Dojo income for ${totals.size} clan(s); total venues: ${venues.length}`
      );
    } catch (err) {
      this.logger.warn(
        `accrueDojoIncome failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
