import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityEventsController } from './activity-events.controller';
import { ActivityEventsGateway } from './activity-events.gateway';
import { ActivityEventsService } from './activity-events.service';

@Module({
  controllers: [ActivityEventsController],
  providers: [ActivityEventsGateway, ActivityEventsService, PrismaService],
  exports: [ActivityEventsGateway, ActivityEventsService],
})
export class ActivityEventsModule {}
