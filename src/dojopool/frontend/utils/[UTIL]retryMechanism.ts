interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: Array<string | RegExp>;
}

interface RetryState {
  attempt: number;
  error: Error | null;
  startTime: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryableErrors: [
    "NETWORK_ERROR",
    "TIMEOUT",
    /^5\d{2}$/, // 5XX server errors
    "ECONNRESET",
    "ETIMEDOUT",
  ],
};

export class RetryMechanism {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  private isRetryableError(error: Error): boolean {
    if (!this.config.retryableErrors) return true;

    return this.config.retryableErrors.some((pattern) => {
      if (pattern instanceof RegExp) {
        return pattern.test(error.message) || pattern.test(error.name);
      }
      return error.message.includes(pattern) || error.name.includes(pattern);
    });
  }

  private calculateDelay(attempt: number): number {
    const delay =
      this.config.initialDelay * Math.pow(this.config.backoffFactor, attempt);
    return Math.min(delay, this.config.maxDelay);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (state: RetryState) => void,
  ): Promise<T> {
    let attempt = 0;
    const startTime = Date.now();

    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        const retryState: RetryState = {
          attempt,
          error: error as Error,
          startTime,
        };

        if (
          attempt >= this.config.maxAttempts ||
          !this.isRetryableError(error as Error)
        ) {
          throw error;
        }

        // Notify retry callback if provided
        if (onRetry) {
          onRetry(retryState);
        }

        // Wait before retrying
        const delay = this.calculateDelay(attempt - 1);
        await this.delay(delay);
      }
    }
  }

  // Utility method for wrapping functions with retry logic
  wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    onRetry?: (state: RetryState) => void,
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      return this.execute(() => fn(...args), onRetry) as ReturnType<T>;
    }) as T;
  }

  // Method to create a retry-wrapped fetch
  static async fetch(
    input: RequestInfo,
    init?: RequestInit,
    config?: Partial<RetryConfig>,
  ): Promise<Response> {
    const retryMechanism = new RetryMechanism(config);

    return retryMechanism.execute(async () => {
      const response = await fetch(input, init);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    });
  }
}
