import handler from '../../src/pages/api/v1/venues/register';

type ResShape = {
  statusCode: number;
  headers: Record<string, any>;
  body: any;
  setHeader: (k: string, v: any) => void;
  status: (code: number) => ResShape;
  json: (data: any) => ResShape;
};

function createMockRes(): ResShape {
  const res: Partial<ResShape> = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k: string, v: any) {
      this.headers![k] = v;
    },
    status(code: number) {
      this.statusCode = code;
      return this as ResShape;
    },
    json(data: any) {
      this.body = data;
      return this as ResShape;
    },
  };
  return res as ResShape;
}

describe('POST /api/v1/venues/register (Next API route)', () => {
  it('registers a venue with minimal valid payload', async () => {
    const req: any = {
      method: 'POST',
      body: {
        name: 'Test Venue',
        address: '123 Main',
        city: 'Metro',
        state: 'CA',
        capacity: 50,
        tables: 8,
        amenities: ['WiFi', 'Cafe'],
      },
    };
    const res = createMockRes();

    await handler(req as any, res as any);

    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();
    expect(res.body.id).toMatch(/^venue-/);
    expect(res.body.name).toBe('Test Venue');
    expect(res.body.location.city).toBe('Metro');
  });
});
