interface RateLimitConfig {
  tokensPerInterval: number; // Number of tokens added per interval
  interval: number; // Interval in milliseconds
  burstLimit: number; // Maximum number of tokens that can be accumulated
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining: number;
}

const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  tokensPerInterval: 10,
  interval: 1000, // 1 second
  burstLimit: 50,
};

export class RateLimiter {
  private static instance: RateLimiter;
  private buckets: Map<string, TokenBucket> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();
  private cleanupInterval: number = 60000; // 1 minute
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanup();
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets.entries()) {
        const config = this.configs.get(key) || DEFAULT_RATE_LIMIT_CONFIG;
        if (now - bucket.lastRefill > config.interval * 10) {
          this.buckets.delete(key);
          this.configs.delete(key);
        }
      }
    }, this.cleanupInterval);
  }

  private refillTokens(key: string): void {
    const bucket = this.buckets.get(key);
    const config = this.configs.get(key) || DEFAULT_RATE_LIMIT_CONFIG;

    if (!bucket) return;

    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const intervalsElapsed = Math.floor(timePassed / config.interval);

    if (intervalsElapsed > 0) {
      const newTokens = intervalsElapsed * config.tokensPerInterval;
      bucket.tokens = Math.min(bucket.tokens + newTokens, config.burstLimit);
      bucket.lastRefill = now;
    }
  }

  setConfig(key: string, config: Partial<RateLimitConfig>): void {
    const existingConfig = this.configs.get(key) || DEFAULT_RATE_LIMIT_CONFIG;
    this.configs.set(key, { ...existingConfig, ...config });
  }

  checkLimit(key: string, cost: number = 1): RateLimitResult {
    const config = this.configs.get(key) || DEFAULT_RATE_LIMIT_CONFIG;

    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: config.burstLimit,
        lastRefill: Date.now(),
      });
    }

    this.refillTokens(key);
    const bucket = this.buckets.get(key)!;

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        allowed: true,
        remaining: bucket.tokens,
      };
    }

    const timeToNextToken =
      config.interval - ((Date.now() - bucket.lastRefill) % config.interval);

    return {
      allowed: false,
      retryAfter: timeToNextToken,
      remaining: bucket.tokens,
    };
  }

  async waitForTokens(
    key: string,
    cost: number = 1,
    timeout: number = 30000,
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = this.checkLimit(key, cost);
      if (result.allowed) {
        return true;
      }

      if (result.retryAfter) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(result.retryAfter, 1000)),
        );
      }
    }

    return false;
  }

  resetLimit(key: string): void {
    const config = this.configs.get(key) || DEFAULT_RATE_LIMIT_CONFIG;
    this.buckets.set(key, {
      tokens: config.burstLimit,
      lastRefill: Date.now(),
    });
  }

  getRemainingTokens(key: string): number {
    if (!this.buckets.has(key)) {
      const config = this.configs.get(key) || DEFAULT_RATE_LIMIT_CONFIG;
      return config.burstLimit;
    }

    this.refillTokens(key);
    return this.buckets.get(key)!.tokens;
  }

  getStats(key: string): {
    remaining: number;
    config: RateLimitConfig;
    timeToNextRefill: number;
  } {
    const config = this.configs.get(key) || DEFAULT_RATE_LIMIT_CONFIG;
    const bucket = this.buckets.get(key);

    if (!bucket) {
      return {
        remaining: config.burstLimit,
        config,
        timeToNextRefill: 0,
      };
    }

    this.refillTokens(key);
    const now = Date.now();
    const timeToNextRefill =
      config.interval - ((now - bucket.lastRefill) % config.interval);

    return {
      remaining: bucket.tokens,
      config,
      timeToNextRefill,
    };
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.buckets.clear();
    this.configs.clear();
  }
}
