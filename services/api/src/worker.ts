import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const logger = new Logger('Worker');

  try {
    const app = await NestFactory.createApplicationContext(WorkerModule);

    logger.log('Worker application started successfully');
    logger.log('Job queues are now processing tasks...');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('Received SIGTERM, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('Received SIGINT, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start worker application:', error);
    process.exit(1);
  }
}

bootstrap();
