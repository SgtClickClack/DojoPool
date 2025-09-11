import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DatabasePerformanceService } from './database-performance.service';
import { MonitoringController } from './monitoring.controller';
import { SlowQueryLoggerService } from './slow-query-logger.service';
import { ErrorLoggerService } from './error-logger.service';
import { SchemaEvolutionService } from '../database/schema-evolution.service';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [PrismaModule, TelemetryModule],
  controllers: [MonitoringController],
  providers: [
    DatabasePerformanceService,
    SlowQueryLoggerService,
    ErrorLoggerService,
    SchemaEvolutionService,
  ],
  exports: [
    DatabasePerformanceService,
    SlowQueryLoggerService,
    ErrorLoggerService,
    SchemaEvolutionService,
  ],
})
export class MonitoringModule {}
