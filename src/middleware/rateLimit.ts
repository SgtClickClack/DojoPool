import { NextApiResponse } from 'next';

interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimitStore {
  [key: string]: {
    tokens: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (res: NextApiResponse, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const now = Date.now();
        const resetTime = now + options.interval;

        if (!store[token]) {
          store[token] = {
            tokens: limit - 1,
            resetTime,
          };
          resolve();
          return;
        }

        if (now > store[token].resetTime) {
          store[token] = {
            tokens: limit - 1,
            resetTime,
          };
          resolve();
          return;
        }

        if (store[token].tokens <= 0) {
          res.setHeader('X-RateLimit-Limit', limit);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', store[token].resetTime);
          reject(new Error('Rate limit exceeded'));
          return;
        }

        store[token].tokens -= 1;
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', store[token].tokens);
        res.setHeader('X-RateLimit-Reset', store[token].resetTime);
        resolve();
      }),
  };
} 