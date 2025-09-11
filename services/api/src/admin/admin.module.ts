import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { JobProducer } from '../queue/producers/job.producer';
import { QueueModule } from '../queue/queue.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [QueueModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService, AdminGuard, JobProducer],
})
export class AdminModule {}
