import { Module } from '@nestjs/common';
import { ErrorLoggerService } from './error-logger.service';
import { MonitoringController } from './monitoring.controller';

@Module({
  controllers: [MonitoringController],
  providers: [ErrorLoggerService],
  exports: [ErrorLoggerService],
})
export class MonitoringModule {}
