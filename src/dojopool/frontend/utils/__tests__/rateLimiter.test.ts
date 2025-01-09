import { RateLimiter } from '../rateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Reset singleton instance
    (RateLimiter as any).instance = null;
    rateLimiter = RateLimiter.getInstance();
    jest.useFakeTimers();
  });

  afterEach(() => {
    rateLimiter.destroy();
    jest.useRealTimers();
  });

  describe('basic rate limiting', () => {
    it('should allow requests within rate limit', () => {
      const result = rateLimiter.checkLimit('test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49); // 50 - 1
    });

    it('should block requests when limit is exceeded', () => {
      // Use up all tokens
      for (let i = 0; i < 50; i++) {
        rateLimiter.checkLimit('test');
      }

      const result = rateLimiter.checkLimit('test');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.remaining).toBe(0);
    });

    it('should refill tokens over time', () => {
      // Use up all tokens
      for (let i = 0; i < 50; i++) {
        rateLimiter.checkLimit('test');
      }

      // Advance time by 1 second (1 interval)
      jest.advanceTimersByTime(1000);

      const result = rateLimiter.checkLimit('test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 new tokens - 1 used
    });

    it('should respect burst limit', () => {
      // Set custom config with lower burst limit
      rateLimiter.setConfig('test', {
        burstLimit: 5,
        tokensPerInterval: 2,
        interval: 1000
      });

      // Use up all tokens
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('test');
      }

      // Advance time by 2 seconds
      jest.advanceTimersByTime(2000);

      // Should only have refilled up to burst limit
      const result = rateLimiter.checkLimit('test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 (burst limit) - 1
    });
  });

  describe('configuration', () => {
    it('should apply custom configuration', () => {
      rateLimiter.setConfig('custom', {
        tokensPerInterval: 5,
        interval: 2000,
        burstLimit: 10
      });

      // Use up 6 tokens
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit('custom');
      }

      // Should have 4 tokens remaining
      const result = rateLimiter.checkLimit('custom');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(4);
    });

    it('should allow partial configuration updates', () => {
      rateLimiter.setConfig('test', { tokensPerInterval: 5 });
      
      // Use up 6 tokens
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit('test');
      }

      jest.advanceTimersByTime(1000);

      const result = rateLimiter.checkLimit('test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 new tokens - 1 used
    });
  });

  describe('cleanup', () => {
    it('should cleanup unused buckets', () => {
      rateLimiter.checkLimit('test');
      
      // Advance time by more than cleanup threshold
      jest.advanceTimersByTime(11000); // 10 intervals + 1 second

      // Bucket should be removed
      expect(rateLimiter.getRemainingTokens('test')).toBe(50); // Fresh bucket
    });
  });

  describe('async operations', () => {
    it('should wait for tokens to become available', async () => {
      // Use up all tokens
      for (let i = 0; i < 50; i++) {
        rateLimiter.checkLimit('test');
      }

      const waitPromise = rateLimiter.waitForTokens('test');
      
      // Advance time to make tokens available
      jest.advanceTimersByTime(1000);
      
      const result = await waitPromise;
      expect(result).toBe(true);
    });

    it('should timeout if tokens dont become available', async () => {
      // Use up all tokens
      for (let i = 0; i < 50; i++) {
        rateLimiter.checkLimit('test');
      }

      const result = await rateLimiter.waitForTokens('test', 1, 500);
      expect(result).toBe(false);
    });

    it('should handle multiple costs', async () => {
      const result1 = rateLimiter.checkLimit('test', 30);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(20);

      const result2 = rateLimiter.checkLimit('test', 30);
      expect(result2.allowed).toBe(false);
      expect(result2.remaining).toBe(20);
    });
  });

  describe('statistics', () => {
    it('should provide accurate stats', () => {
      rateLimiter.setConfig('test', {
        tokensPerInterval: 5,
        interval: 1000,
        burstLimit: 10
      });

      // Use some tokens
      rateLimiter.checkLimit('test', 3);

      const stats = rateLimiter.getStats('test');
      expect(stats).toMatchObject({
        remaining: 7,
        config: {
          tokensPerInterval: 5,
          interval: 1000,
          burstLimit: 10
        },
        timeToNextRefill: expect.any(Number)
      });
    });

    it('should calculate time to next refill', () => {
      rateLimiter.checkLimit('test');
      
      jest.advanceTimersByTime(500);
      
      const stats = rateLimiter.getStats('test');
      expect(stats.timeToNextRefill).toBeLessThanOrEqual(500);
      expect(stats.timeToNextRefill).toBeGreaterThan(0);
    });
  });

  describe('reset operations', () => {
    it('should reset limits', () => {
      // Use some tokens
      for (let i = 0; i < 30; i++) {
        rateLimiter.checkLimit('test');
      }

      rateLimiter.resetLimit('test');
      
      const result = rateLimiter.checkLimit('test');
      expect(result.remaining).toBe(49); // 50 - 1
    });

    it('should handle destroy cleanup', () => {
      rateLimiter.checkLimit('test');
      rateLimiter.destroy();

      // Should create new bucket after destroy
      const result = rateLimiter.checkLimit('test');
      expect(result.remaining).toBe(49);
    });
  });
});
