import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CanActivate } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { WebSocketJwtGuard } from './websocket-jwt.guard';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // How long to block after exceeding limit
}

export interface WebSocketRateLimitOptions {
  connections: RateLimitConfig;
  messages: RateLimitConfig;
  subscriptions?: RateLimitConfig;
}

@Injectable()
export class WebSocketRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketRateLimitGuard.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    try {
      // Get authenticated user
      const user = WebSocketJwtGuard.getUserFromSocket(client);

      // Get namespace from socket
      const namespace = client.nsp.name;

      // Get rate limit options from metadata (set by decorator)
      const rateLimitOptions = this.reflector.get<WebSocketRateLimitOptions>(
        'websocket-rate-limit',
        context.getHandler()
      );

      if (!rateLimitOptions) {
        // No rate limiting configured for this handler
        return true;
      }

      // Check rate limit based on handler type
      const handlerName = context.getHandler().name;

      if (handlerName === 'handleConnection') {
        return await this.checkRateLimit(
          user.id,
          namespace,
          'connection',
          rateLimitOptions.connections
        );
      } else if (
        handlerName.includes('send') ||
        handlerName.includes('handleMessage')
      ) {
        return await this.checkRateLimit(
          user.id,
          namespace,
          'message',
          rateLimitOptions.messages
        );
      } else if (
        handlerName.includes('join') ||
        handlerName.includes('subscribe')
      ) {
        if (rateLimitOptions.subscriptions) {
          return await this.checkRateLimit(
            user.id,
            namespace,
            'subscription',
            rateLimitOptions.subscriptions
          );
        }
      }

      // Default: allow if no specific limit applies
      return true;
    } catch (error) {
      this.logger.error(
        `Rate limit check failed for client ${client.id}:`,
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  private async checkRateLimit(
    userId: string,
    namespace: string,
    action: string,
    config: RateLimitConfig
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const key = `ratelimit:ws:${userId}:${namespace}:${action}`;
    const windowKey = `${key}:window`;
    const blockKey = `${key}:blocked`;

    try {
      // Check if user is currently blocked
      const blockExpiry = await this.redisService.get(blockKey);
      if (blockExpiry) {
        const blockUntil = parseInt(blockExpiry);
        if (now < blockUntil) {
          const remainingBlockTime = Math.ceil((blockUntil - now) / 1000);
          throw new BadRequestException(
            `Rate limit exceeded. Try again in ${remainingBlockTime} seconds.`
          );
        } else {
          // Block has expired, remove it
          await this.redisService.del(blockKey);
        }
      }

      // Get current request count for this window
      const currentCount = await this.getRequestCount(windowKey, windowStart);

      // Check if limit exceeded
      if (currentCount >= config.maxRequests) {
        // Apply block
        const blockDuration = config.blockDurationMs || config.windowMs;
        const blockUntil = now + blockDuration;

        await this.redisService.set(
          blockKey,
          blockUntil.toString(),
          Math.ceil(blockDuration / 1000)
        );

        this.logger.warn(
          `Rate limit exceeded for user ${userId} in namespace ${namespace} action ${action}. ` +
            `Blocked until ${new Date(blockUntil).toISOString()}`
        );

        throw new BadRequestException(
          `Rate limit exceeded. Try again in ${Math.ceil(blockDuration / 1000)} seconds.`
        );
      }

      // Increment counter
      await this.incrementRequestCount(windowKey, windowStart);

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      // If Redis fails, allow request (fail open for rate limiting)
      this.logger.warn(
        `Redis rate limit check failed for user ${userId}, allowing request:`,
        error instanceof Error ? error.message : String(error)
      );
      return true;
    }
  }

  private async getRequestCount(
    windowKey: string,
    windowStart: number
  ): Promise<number> {
    try {
      // Get all requests in current window
      const requests = await this.redisService.keys(`${windowKey}:*`);
      let count = 0;

      for (const requestKey of requests) {
        const timestamp = parseInt(requestKey.split(':').pop() || '0');
        if (timestamp >= windowStart) {
          const value = await this.redisService.get(requestKey);
          count += parseInt(value || '0');
        } else {
          // Clean up old entries
          await this.redisService.del(requestKey);
        }
      }

      return count;
    } catch (error) {
      this.logger.warn('Failed to get request count from Redis:', error);
      return 0;
    }
  }

  private async incrementRequestCount(
    windowKey: string,
    windowStart: number
  ): Promise<void> {
    try {
      const requestKey = `${windowKey}:${Date.now()}`;
      const ttl = Math.ceil((Date.now() - windowStart + 60000) / 1000); // TTL with 1 minute buffer

      await this.redisService.set(requestKey, '1', ttl);
    } catch (error) {
      this.logger.warn('Failed to increment request count in Redis:', error);
    }
  }
}

// Decorator to set rate limit options on handlers
export function WebSocketRateLimit(options: WebSocketRateLimitOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('websocket-rate-limit', options, descriptor.value);
  };
}

// Predefined rate limit configurations for different namespaces
export const RATE_LIMIT_PRESETS = {
  // Chat: Allow frequent but not spammy messaging
  CHAT: {
    connections: { windowMs: 60000, maxRequests: 5, blockDurationMs: 300000 }, // 5 connections/min, 5min block
    messages: { windowMs: 10000, maxRequests: 10, blockDurationMs: 60000 }, // 10 messages/10sec, 1min block
  } as WebSocketRateLimitOptions,

  // Matches: Allow real-time updates but prevent spam
  MATCHES: {
    connections: { windowMs: 60000, maxRequests: 10, blockDurationMs: 300000 },
    messages: { windowMs: 5000, maxRequests: 20, blockDurationMs: 30000 }, // 20 messages/5sec, 30sec block
    subscriptions: { windowMs: 60000, maxRequests: 20, blockDurationMs: 60000 },
  } as WebSocketRateLimitOptions,

  // Tournaments: Moderate connection rate for tournament management
  TOURNAMENTS: {
    connections: { windowMs: 60000, maxRequests: 3, blockDurationMs: 300000 },
    messages: { windowMs: 30000, maxRequests: 5, blockDurationMs: 120000 }, // 5 messages/30sec, 2min block
  } as WebSocketRateLimitOptions,

  // Notifications: Low rate for system notifications
  NOTIFICATIONS: {
    connections: { windowMs: 300000, maxRequests: 2, blockDurationMs: 900000 }, // 2 connections/5min, 15min block
    messages: { windowMs: 60000, maxRequests: 1, blockDurationMs: 300000 }, // 1 message/min, 5min block
  } as WebSocketRateLimitOptions,

  // World Map: Allow frequent location updates
  WORLD_MAP: {
    connections: { windowMs: 60000, maxRequests: 5, blockDurationMs: 300000 },
    messages: { windowMs: 10000, maxRequests: 30, blockDurationMs: 30000 }, // 30 messages/10sec, 30sec block
  } as WebSocketRateLimitOptions,

  // Activity Events: Low rate for activity broadcasting
  ACTIVITY: {
    connections: { windowMs: 300000, maxRequests: 2, blockDurationMs: 900000 },
    messages: { windowMs: 60000, maxRequests: 1, blockDurationMs: 300000 },
  } as WebSocketRateLimitOptions,
} as const;
