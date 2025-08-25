import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { corsOptions } from './config/cors.config';
import { WorldMapGateway } from './world-map/world-map.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 1. Set global API prefix
  app.setGlobalPrefix('api/v1');

  // 2. Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
    })
  );

  // 2.1 JSON and URL-encoded parsers (increase body size limits)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Enable Helmet security headers
  app.use(helmet());

  // 4. Enable central CORS
  app.enableCors(corsOptions);

  // 5. Apply rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per window
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // 6. Enable WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  await app.listen(port);

  logger.log(`API listening on http://localhost:${port}`);
  logger.log(`WebSocket server enabled on ws://localhost:${port}`);

  // Start simulation for testing (remove in production)
  if (process.env.NODE_ENV === 'development') {
    try {
      logger.log('Starting world map simulation for development...');
      // Resolve by class token only if registered in the module graph
      const worldMapGateway = app.get(WorldMapGateway, { strict: false });
      if (
        worldMapGateway &&
        typeof (worldMapGateway as any).startSimulation === 'function'
      ) {
        (worldMapGateway as any).startSimulation();
      } else {
        logger.warn('WorldMapGateway not available; skipping simulation');
      }
    } catch (err) {
      logger.warn('WorldMapGateway not found; skipping simulation');
    }
  }
}

void bootstrap();
