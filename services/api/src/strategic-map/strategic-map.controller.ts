import { Controller, Get, Post } from '@nestjs/common';
import { CacheInvalidate, MapCache } from '../cache/edge-cache.decorator';
import { StrategicMapService } from './strategic-map.service';

@Controller('api/v1/strategic-map')
export class StrategicMapController {
  constructor(private readonly strategic: StrategicMapService) {}

  @Get('overview')
  @MapCache()
  getOverview() {
    return this.strategic.getOverview();
  }

  @Post('tick')
  @CacheInvalidate(['strategic-map:*', 'territories:map'])
  async runTick() {
    await this.strategic.tickResources();
    return { success: true };
  }
}
