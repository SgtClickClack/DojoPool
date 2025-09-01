import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StrategicMapService } from './strategic-map.service';

@Injectable()
export class StrategicMapScheduler {
  private readonly logger = new Logger(StrategicMapScheduler.name);

  constructor(private readonly strategic: StrategicMapService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleResourceTick() {
    try {
      await this.strategic.tickResources();
      this.logger.log('Strategic resource tick completed');
    } catch (err) {
      this.logger.warn(`Strategic resource tick failed: ${String(err)}`);
    }
  }
}
