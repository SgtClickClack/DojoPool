import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationTemplatesService,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    NotificationTemplatesService,
  ],
})
export class NotificationsModule {}
