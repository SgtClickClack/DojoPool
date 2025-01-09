import { RetryMechanism } from '../retryMechanism';

describe('RetryMechanism', () => {
  let retryMechanism: RetryMechanism;

  beforeEach(() => {
    retryMechanism = new RetryMechanism({
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffFactor: 2
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should successfully execute operation on first try', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await retryMechanism.execute(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry failed operation up to maxAttempts', async () => {
    const error = new Error('NETWORK_ERROR');
    const operation = jest.fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success');

    const onRetry = jest.fn();
    const result = await retryMechanism.execute(operation, onRetry);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: 1,
        error: error
      })
    );
  });

  it('should throw error after maxAttempts', async () => {
    const error = new Error('NETWORK_ERROR');
    const operation = jest.fn().mockRejectedValue(error);
    const onRetry = jest.fn();

    await expect(retryMechanism.execute(operation, onRetry))
      .rejects.toThrow('NETWORK_ERROR');

    expect(operation).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('should not retry non-retryable errors', async () => {
    const error = new Error('NON_RETRYABLE_ERROR');
    const operation = jest.fn().mockRejectedValue(error);
    const onRetry = jest.fn();

    const customRetry = new RetryMechanism({
      maxAttempts: 3,
      retryableErrors: ['NETWORK_ERROR']
    });

    await expect(customRetry.execute(operation, onRetry))
      .rejects.toThrow('NON_RETRYABLE_ERROR');

    expect(operation).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('should respect exponential backoff delays', async () => {
    const error = new Error('NETWORK_ERROR');
    const operation = jest.fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success');

    const promise = retryMechanism.execute(operation);
    
    // First retry should be after 100ms
    jest.advanceTimersByTime(99);
    expect(operation).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(operation).toHaveBeenCalledTimes(2);

    // Second retry should be after 200ms
    jest.advanceTimersByTime(199);
    expect(operation).toHaveBeenCalledTimes(2);
    
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(operation).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result).toBe('success');
  });

  it('should wrap function with retry logic', async () => {
    const error = new Error('NETWORK_ERROR');
    const fn = jest.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success');

    const wrappedFn = retryMechanism.wrap(fn);
    const result = await wrappedFn('arg1', 'arg2');

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  describe('fetch wrapper', () => {
    let originalFetch: typeof fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should retry failed fetch requests', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch
        .mockRejectedValueOnce(new Error('NETWORK_ERROR'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' })
        });

      const response = await RetryMechanism.fetch('https://api.example.com/data');
      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw on HTTP errors', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(RetryMechanism.fetch('https://api.example.com/data'))
        .rejects.toThrow('HTTP error! status: 500');
    });
  });
});
