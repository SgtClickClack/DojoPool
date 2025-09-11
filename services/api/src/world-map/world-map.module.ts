import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FeatureFlagsConfig } from '../config/feature-flags.config';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { WorldMapGateway } from './world-map.gateway';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [WorldMapGateway, FeatureFlagsConfig, PrismaService],
  exports: [WorldMapGateway],
})
export class WorldMapModule {}
