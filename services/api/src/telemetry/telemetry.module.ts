import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsController,
  TelemetryController,
} from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

@Module({
  controllers: [TelemetryController, AnalyticsController],
  providers: [TelemetryService, PrismaService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
