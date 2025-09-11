import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionRouterService } from './connection-router.service';
import { DatabaseController } from './database.controller';
import { DatabaseHealthMonitorService } from './health-monitor.service';
import { RegionalFailoverService } from './regional-failover.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [DatabaseController],
  providers: [
    PrismaService,
    RegionalFailoverService,
    ConnectionRouterService,
    DatabaseHealthMonitorService,
  ],
  exports: [
    PrismaService,
    RegionalFailoverService,
    ConnectionRouterService,
    DatabaseHealthMonitorService,
  ],
})
export class DatabaseModule {}
