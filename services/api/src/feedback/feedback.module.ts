import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [CacheModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, PrismaService, NotificationsService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
