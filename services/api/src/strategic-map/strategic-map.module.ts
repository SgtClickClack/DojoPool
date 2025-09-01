import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { WorldMapModule } from '../world-map/world-map.module';
import { StrategicMapController } from './strategic-map.controller';
import { StrategicMapScheduler } from './strategic-map.scheduler';
import { StrategicMapService } from './strategic-map.service';

@Module({
  imports: [PrismaModule, WorldMapModule],
  controllers: [StrategicMapController],
  providers: [StrategicMapService, PrismaService, StrategicMapScheduler],
})
export class StrategicMapModule {}
