import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { JobProducer } from '../queue/producers/job.producer';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService, AdminGuard, JobProducer],
})
export class AdminModule {}
