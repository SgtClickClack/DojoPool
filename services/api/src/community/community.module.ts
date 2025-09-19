import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CacheModule } from '../cache/cache.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [
    CacheModule,
    NotificationsModule,
    PermissionsModule,
    MulterModule.register({
      dest: './uploads/cosmetic-items',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        // Allow common cosmetic item file types
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/zip',
          'application/x-zip-compressed',
          'application/octet-stream',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Unsupported file type'), false);
        }
      },
    }),
  ],
  controllers: [CommunityController],
  providers: [CommunityService, PrismaService],
  exports: [CommunityService],
})
export class CommunityModule {}
