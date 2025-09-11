import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityEventsController } from './activity-events.controller';
import { ActivityEventsGateway } from './activity-events.gateway';
import { ActivityEventsService } from './activity-events.service';

@Module({
  imports: [AuthModule],
  controllers: [ActivityEventsController],
  providers: [ActivityEventsGateway, ActivityEventsService, PrismaService],
  exports: [ActivityEventsGateway, ActivityEventsService],
})
export class ActivityEventsModule {}
