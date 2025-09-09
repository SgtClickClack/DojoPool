import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DatabasePerformanceService } from './database-performance.service';
import { MonitoringController } from './monitoring.controller';
import { SlowQueryLoggerService } from './slow-query-logger.service';

@Module({
  imports: [PrismaModule],
  controllers: [MonitoringController],
  providers: [DatabasePerformanceService, SlowQueryLoggerService],
  exports: [DatabasePerformanceService, SlowQueryLoggerService],
})
export class MonitoringModule {}
