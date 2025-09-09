import { Controller, Get } from '@nestjs/common';
import { QueueService } from '../queue.service';

@Controller('admin/queues')
export class QueueMonitoringController {
  constructor(private readonly queueService: QueueService) {}

  @Get('stats')
  async getQueueStats() {
    return await this.queueService.getAllQueueStats();
  }

  @Get('health')
  async getQueueHealth() {
    try {
      const stats = await this.queueService.getAllQueueStats();
      const isHealthy = Object.values(stats).every(
        (queueStats) => !queueStats.error && typeof queueStats === 'object'
      );

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        queues: stats,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('config')
  async getQueueConfig() {
    return this.queueService.getConfig();
  }
}
