import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, RedisModule, MonitoringModule, CacheModule],
  controllers: [HealthController],
})
export class HealthModule {}
