import { Module } from '@nestjs/common';
import { ActivityEventsGateway } from './activity-events.gateway';
import { ActivityEventsService } from './activity-events.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ActivityEventsGateway, ActivityEventsService, PrismaService],
  exports: [ActivityEventsGateway, ActivityEventsService],
})
export class ActivityEventsModule {}
