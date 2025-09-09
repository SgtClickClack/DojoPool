import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';

export function setupBullBoard(queues: Queue[]) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const adapters = queues.map((queue) => new BullMQAdapter(queue));

  createBullBoard({
    queues: adapters,
    serverAdapter,
  });

  return serverAdapter;
}
