import { Module } from '@nestjs/common';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { ErrorsController } from './errors.controller';

@Module({
  controllers: [ErrorsController],
  imports: [MonitoringModule],
})
export class ErrorsModule {}
