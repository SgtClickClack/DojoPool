import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TerritoriesController } from './territories.controller';
import { TerritoriesService } from './territories.service';

@Module({
  controllers: [TerritoriesController],
  providers: [TerritoriesService, PrismaService],
})
export class TerritoriesModule {}
