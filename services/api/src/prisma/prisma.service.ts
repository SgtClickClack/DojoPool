import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ErrorUtils } from '../common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected successfully');
    } catch (err) {
      this.logger.warn(
        `Prisma connection failed, continuing with fallback: ${ErrorUtils.getErrorMessage(
          err
        )}`
      );
      // Do not rethrow to allow the application to run with in-memory fallbacks
    }
  }
}
