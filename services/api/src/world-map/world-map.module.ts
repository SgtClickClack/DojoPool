import { Module } from '@nestjs/common';
import { WorldMapGateway } from './world-map.gateway';

@Module({
  providers: [WorldMapGateway],
  exports: [WorldMapGateway],
})
export class WorldMapModule {}
