import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private isProduction = false;

  constructor(private configService: ConfigService) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  async onModuleInit() {
    // Validate production requirements before initialization
    this.validateProductionRequirements();

    if (this.isProduction) {
      await this.initializeRedisClients();
    } else {
      this.logger.log('Skipping Redis initialization in development mode');
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private validateProductionRequirements(): void {
    if (this.isProduction) {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      const redisHost = this.configService.get<string>('REDIS_HOST');
      const redisPort = this.configService.get<string>('REDIS_PORT');

      if (!redisUrl && !redisHost) {
        throw new Error(
          'Redis configuration is MANDATORY in production mode. ' +
            'Please set REDIS_URL or REDIS_HOST environment variable. ' +
            'The application will not start without Redis in production.'
        );
      }

      if (redisHost && !redisPort) {
        throw new Error(
          'REDIS_PORT is MANDATORY when using REDIS_HOST in production mode. ' +
            'Please set REDIS_PORT environment variable.'
        );
      }

      this.logger.log('Production Redis requirements validated successfully');
    }
  }

  private async initializeRedisClients() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    try {
      // Create separate pub/sub clients for Socket.IO Redis adapter
      if (redisUrl) {
        this.pubClient = new Redis(redisUrl);
        this.subClient = new Redis(redisUrl);
      } else {
        const redisConfig = {
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        };

        this.pubClient = new Redis(redisConfig);
        this.subClient = new Redis(redisConfig);
      }

      // Set up event handlers
      this.pubClient.on('connect', () => {
        this.logger.log('Redis pub client connected successfully');
      });

      this.pubClient.on('error', (error) => {
        this.logger.error('Redis pub client error:', error);
      });

      this.subClient.on('connect', () => {
        this.logger.log('Redis sub client connected successfully');
      });

      this.subClient.on('error', (error) => {
        this.logger.error('Redis sub client error:', error);
      });

      // Test connections
      await Promise.all([this.pubClient.ping(), this.subClient.ping()]);

      this.logger.log('Redis clients initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis clients:', error);
      if (this.isProduction) {
        throw new Error(
          'Redis initialization failed in production mode. ' +
            'The application cannot start without Redis in production. ' +
            'Error: ' +
            (error as Error).message
        );
      }
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.pubClient) {
        await this.pubClient.quit();
        this.pubClient = null;
      }
      if (this.subClient) {
        await this.subClient.quit();
        this.subClient = null;
      }
      this.logger.log('Redis clients disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Redis clients:', error);
    }
  }

  createSocketAdapter(): ReturnType<typeof createAdapter> | null {
    if (!this.isProduction) {
      this.logger.warn(
        'Socket.IO Redis adapter requested in non-production mode'
      );
      return null;
    }

    if (!this.pubClient || !this.subClient) {
      const error =
        'Redis clients not available for Socket.IO adapter in production mode';
      this.logger.error(error);
      throw new Error(error);
    }

    try {
      return createAdapter(this.pubClient, this.subClient);
    } catch (error) {
      this.logger.error('Failed to create Redis adapter:', error);
      throw new Error(
        'Failed to create Redis adapter in production mode. ' +
          'Error: ' +
          (error as Error).message
      );
    }
  }

  async ping(): Promise<boolean> {
    if (!this.isProduction) {
      return true; // Return true for dev mode
    }

    if (!this.pubClient) {
      return false;
    }

    try {
      const result = await this.pubClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      return false;
    }
  }

  isEnabled(): boolean {
    return (
      this.isProduction && this.pubClient !== null && this.subClient !== null
    );
  }

  isProductionMode(): boolean {
    return this.isProduction;
  }

  getConnectionStatus(): {
    isProduction: boolean;
    isConnected: boolean;
    pubClientConnected: boolean;
    subClientConnected: boolean;
  } {
    return {
      isProduction: this.isProduction,
      isConnected: this.isEnabled(),
      pubClientConnected: this.pubClient !== null,
      subClientConnected: this.subClient !== null,
    };
  }
}
