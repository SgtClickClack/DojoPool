import { createMocks } from 'node-mocks-http';
import handler from './narrative';

// Mock the NarrativeService so that we can simulate asset generation without hitting the real MCP tool.
jest.mock('../../services/NarrativeService', () => {
  return jest.fn().mockImplementation(() => {
    return {
      // Simulate processEvent always returning a dummy asset.
      processEvent: jest.fn().mockResolvedValue({
        url: 'dummy_asset_url',
        width: 800,
        height: 600
      })
    };
  });
});

describe('Narrative API Route', () => {
  // Ensure the MCP configuration environment variables are set.
  beforeAll(() => {
    process.env.MCP_API_KEY = 'dummy_key';
    process.env.MCP_API_ENDPOINT = 'https://dummy.endpoint.com';
  });

  test('returns 405 when using an unsupported HTTP method', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
    const json = res._getJSONData();
    expect(json.error).toBe('Method not allowed');
  });

  test('returns 400 when required fields are missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { baseDescription: 'Test description' } // Missing "context"
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    const json = res._getJSONData();
    expect(json.error).toBe('Missing required fields: baseDescription, context');
  });

  test('returns 200 and asset data on valid input', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { baseDescription: 'Test asset generation', context: 'kung fu style' }
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const json = res._getJSONData();
    expect(json.asset).toEqual({
      url: 'dummy_asset_url',
      width: 800,
      height: 600
    });
  });
}); 