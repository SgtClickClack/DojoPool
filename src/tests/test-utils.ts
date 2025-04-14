import { jest } from '@jest/globals';

interface MockResponse<T = unknown> {
  ok: boolean;
  status: number;
  json: () => Promise<T>;
  text: () => Promise<string>;
}

export const createMockResponse = <T>(data: T, status = 200): MockResponse<T> => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data))
});

export const mockFetch = <T>(response: MockResponse<T>): jest.Mock => {
  return jest.fn().mockResolvedValue(response);
}; 