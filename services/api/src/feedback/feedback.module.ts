import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PrismaService } from '../prisma/prisma.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [CacheModule, NotificationsModule, PermissionsModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, PrismaService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
