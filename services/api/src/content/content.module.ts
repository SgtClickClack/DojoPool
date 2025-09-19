import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CacheModule } from '../cache/cache.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PrismaService } from '../prisma/prisma.service';
import { CmsController } from './cms.controller';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [
    CacheModule,
    NotificationsModule,
    PermissionsModule,
    MulterModule.register({
      dest: './uploads/content',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        // Allow common content types
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'video/mp4',
          'video/webm',
          'application/json',
          'text/plain',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Unsupported file type'), false);
        }
      },
    }),
  ],
  controllers: [ContentController, CmsController],
  providers: [ContentService, PrismaService],
  exports: [ContentService],
})
export class ContentModule {}
