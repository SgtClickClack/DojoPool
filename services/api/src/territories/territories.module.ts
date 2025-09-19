import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TerritoriesController } from './territories.controller';
import { TerritoriesService } from './territories.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TerritoriesController],
  providers: [TerritoriesService, PrismaService],
  exports: [TerritoriesService],
})
export class TerritoriesModule {}
