import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalErrorHandler } from './common/error-handler.middleware';
import { corsOptions } from './config/cors.config';
import { ErrorLoggerService } from './monitoring/error-logger.service';
import { setupBullBoard } from './queue/monitoring/bull-board.setup';
import { QueueService } from './queue/queue.service';
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
  app.useGlobalFilters(new GlobalErrorHandler(app.get(ErrorLoggerService)));

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

  // Swagger/OpenAPI configuration
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('DojoPool API')
      .setDescription(
        'Comprehensive API documentation for DojoPool - The Ultimate Pool Gaming Platform. ' +
          'This API provides endpoints for user management, tournaments, clans, territories, ' +
          'real-time analytics, achievements, and WebSocket communication for live pool gaming.'
      )
      .setVersion('1.0')
      .addTag(
        'Authentication',
        'User authentication and authorization endpoints'
      )
      .addTag('Users', 'User profile management and account operations')
      .addTag(
        'Tournaments',
        'Tournament creation, management, and participation'
      )
      .addTag('Clans', 'Clan creation, management, and member operations')
      .addTag('Territories', 'Territory control and venue management')
      .addTag('Matches', 'Match tracking, results, and analytics')
      .addTag('Analytics', 'Real-time analytics and dashboard data')
      .addTag('Achievements', 'Achievement system and reward management')
      .addTag('Notifications', 'Real-time notifications and messaging')
      .addTag('WebSocket', 'Real-time communication via WebSocket')
      .addTag('Admin', 'Administrative operations and system management')
      .addTag('Health', 'System health checks and monitoring')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth'
      )
      .addServer('http://localhost:3002', 'Development Server')
      .addServer('https://api.dojopool.com', 'Production Server')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Add custom OpenAPI extensions for DojoPool
    document.info = {
      ...document.info,
      contact: {
        name: 'DojoPool Team',
        email: 'api@dojopool.com',
        url: 'https://dojopool.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      'x-logo': {
        url: 'https://dojopool.com/logo.png',
        backgroundColor: '#1a1a2e',
        altText: 'DojoPool Logo',
      },
    };

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        syntaxHighlight: {
          activate: true,
          theme: 'arta',
        },
        tryItOutEnabled: true,
        requestInterceptor: (req) => {
          // Add any custom request interceptors if needed
          return req;
        },
        responseInterceptor: (res) => {
          // Add any custom response interceptors if needed
          return res;
        },
      },
      customSiteTitle: 'DojoPool API Documentation',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #00d4ff }
        .swagger-ui .scheme-container { background: #0f0f23 }
        .swagger-ui .btn { background-color: #00d4ff; border-color: #00d4ff }
        .swagger-ui .btn:hover { background-color: #0099cc; border-color: #0099cc }
      `,
      customfavIcon: '/favicon.ico',
    });

    console.log(
      '📚 Swagger documentation available at: http://localhost:' +
        port +
        '/api/docs'
    );
  }

  // Bull Board setup for job queue monitoring
  try {
    // Get the QueueService from the app context
    const queueService = app.get(QueueService);

    if (queueService) {
      const queues = [
        queueService.getQueue('ai-analysis'),
        queueService.getQueue('batch-updates'),
        queueService.getQueue('analytics-processing'),
      ].filter(Boolean); // Filter out undefined queues

      if (queues.length > 0) {
        const serverAdapter = setupBullBoard(queues);
        app.use('/admin/queues', serverAdapter.getRouter());

        console.log(
          '📊 Bull Board monitoring available at: http://localhost:' +
            port +
            '/admin/queues'
        );
      } else {
        console.log('ℹ️ Bull Board not configured: No queues available');
      }
    } else {
      console.log('ℹ️ Bull Board not configured: QueueService not available');
    }
  } catch (error) {
    console.log('ℹ️ Bull Board setup skipped:', error.message);
  }

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
