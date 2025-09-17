import { Controller, Get, Post } from '@nestjs/common';
import { StrategicMapService } from './strategic-map.service';

@Controller('strategic-map')
export class StrategicMapController {
  constructor(private readonly strategic: StrategicMapService) {}

  @Get('overview')
  getOverview() {
    return this.strategic.getOverview();
  }

  @Post('tick')
  async runTick() {
    await this.strategic.tickResources();
    return { success: true };
  }
}
