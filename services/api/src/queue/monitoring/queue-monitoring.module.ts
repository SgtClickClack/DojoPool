import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { Module } from '@nestjs/common';
import { QueueService } from '../queue.service';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [QueueService],
})
export class QueueMonitoringModule {}
