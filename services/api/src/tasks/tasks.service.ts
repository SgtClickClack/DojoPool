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
        status: "PENDING",
        expiresAt: {
          not: null,
          lt: now,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} challenge(s)`);
    }
  }
}
