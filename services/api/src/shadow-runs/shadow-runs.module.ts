import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShadowRunsController } from './shadow-runs.controller';
import { ShadowRunsService } from './shadow-runs.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ShadowRunsController],
  providers: [ShadowRunsService],
})
export class ShadowRunsModule {}
