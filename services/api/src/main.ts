import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalErrorHandler } from './common/error-handler.middleware';
import { corsOptions } from './config/cors.config';
import { RedisService } from './redis/redis.service';

// Startup validation function
function validateEnvironment(): void {
  const logger = new Logger('StartupValidation');
  const isProduction = process.env.NODE_ENV === 'production';

  logger.log('🔍 Validating environment variables...');

  // Required in all environments
  const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];

  // Required only in production
  const productionVars = [
    'REDIS_URL',
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
  ];

  // Validate feature flags for production safety
  if (isProduction) {
    logger.log('🔍 Validating production feature flags...');

    // Warn about potentially unsafe feature flags in production
    const unsafeFlags = [];
    if (process.env.ENABLE_SIMULATION === 'true') {
      unsafeFlags.push('ENABLE_SIMULATION');
    }
    if (process.env.SIMULATION_FEATURE_FLAG === 'true') {
      unsafeFlags.push('SIMULATION_FEATURE_FLAG');
    }
    if (process.env.BACKGROUND_BROADCASTING === 'true') {
      unsafeFlags.push('BACKGROUND_BROADCASTING');
    }

    if (unsafeFlags.length > 0) {
      logger.warn(
        `⚠️ Warning: Background task flags enabled in production: ${unsafeFlags.join(', ')}. ` +
          'This may impact production performance. Consider disabling these flags.'
      );
    } else {
      logger.log('✅ Background task flags properly disabled in production');
    }
  }

  // Check required variables
  const missingRequired: string[] = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingRequired.push(varName);
    }
  }

  // Check production variables
  const missingProduction: string[] = [];
  if (isProduction) {
    for (const varName of productionVars) {
      if (!process.env[varName]) {
        missingProduction.push(varName);
      }
    }
  }

  // Report missing variables
  if (missingRequired.length > 0) {
    logger.error(
      `❌ Missing required environment variables: ${missingRequired.join(', ')}`
    );
    throw new Error(
      `Application cannot start. Missing required environment variables: ${missingRequired.join(', ')}`
    );
  }

  if (missingProduction.length > 0) {
    logger.error(
      `❌ Missing production environment variables: ${missingProduction.join(', ')}`
    );
    throw new Error(
      `Application cannot start in production. Missing required environment variables: ${missingProduction.join(', ')}`
    );
  }

  // Warn about optional variables
  const optionalVars = [
    'PORT',
    'FRONTEND_URL',
    'CORS_ORIGINS',
    'SESSION_SECRET',
  ];

  const missingOptional: string[] = [];
  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    }
  }

  if (missingOptional.length > 0) {
    logger.warn(
      `⚠️ Missing optional environment variables (using defaults): ${missingOptional.join(', ')}`
    );
  }

  logger.log('✅ Environment validation completed successfully');
}

class SocketIORedisAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIORedisAdapter.name);

  constructor(
    app: any,
    private readonly redisService: RedisService
  ) {
    super(app);
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: corsOptions,
    });

    // Configure Redis adapter for production
    if (this.redisService.isProductionMode()) {
      try {
        const adapter = this.redisService.createSocketAdapter();
        server.adapter(adapter);
        this.logger.log(
          'Socket.IO Redis adapter configured successfully for production'
        );
      } catch (error) {
        this.logger.error(
          'Failed to configure Redis adapter in production:',
          error
        );
        throw error; // Fail fast in production
      }
    } else {
      this.logger.log(
        'Socket.IO using default in-memory adapter for development'
      );
    }

    return server;
  }
}

async function bootstrap() {
  // Validate environment variables before starting
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  // Apply global error handler
  app.useGlobalFilters(new GlobalErrorHandler(app.get('ErrorLoggerService')));

  // WebSocket adapter configuration
  try {
    const redisService = app.get(RedisService);

    if (redisService.isProductionMode()) {
      // In production, Redis adapter is mandatory
      app.useWebSocketAdapter(new SocketIORedisAdapter(app, redisService));
      console.log('✅ WebSocket adapter: Redis (production mode)');
    } else {
      // In development, use in-memory adapter
      app.useWebSocketAdapter(new SocketIORedisAdapter(app, redisService));
      console.log('✅ WebSocket adapter: In-memory (development mode)');
    }
  } catch (error) {
    console.error('❌ Failed to configure WebSocket adapter:', error);
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Application cannot start in production without Redis');
      process.exit(1);
    } else {
      console.log(
        'ℹ️ WebSocket adapter: default (Redis service not available)'
      );
    }
  }

  // Security middleware
  app.use(helmet());
  // Global rate limiter
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  // Stricter limits on auth endpoints to mitigate brute force
  app.use(
    '/api/v1/auth/login',
    rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true })
  );
  app.use(
    '/api/v1/auth/register',
    rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true })
  );
  app.use(
    '/api/v1/auth/refresh',
    rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true })
  );

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // CORS configuration
  app.enableCors(corsOptions);

  // Global prefix for API routes
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`✅ DojoPool API listening on http://localhost:${port}`);
  console.log(`✅ Health check: http://localhost:${port}/api/v1/health`);
  console.log('✅ Backend started successfully with NestJS!');
}

bootstrap().catch((error) => {
  console.error('❌ Error starting the application:', error);
  process.exit(1);
});
