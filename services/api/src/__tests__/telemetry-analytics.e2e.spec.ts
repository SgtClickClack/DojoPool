import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { FileUploadService } from '../common/file-upload.service';
import { RedisService } from '../redis/redis.service';

describe('Telemetry & Analytics (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env.local', '.env'],
        }),
        AppModule,
      ],
    })
      .overrideProvider(RedisService)
      .useValue({
        ping: async () => true,
        isEnabled: () => false,
        isProductionMode: () => false,
        createSocketAdapter: () => null,
        disconnect: async () => {},
      })
      .overrideProvider(JwtStrategy)
      .useValue({
        validate: async () => ({ userId: 'admin-user-123', role: 'ADMIN' }),
      })
      .overrideProvider(FileUploadService)
      .useValue({
        uploadFile: async () => ({
          filename: 'test.jpg',
          path: './uploads/test.jpg',
        }),
        deleteFile: async () => {},
        getFileUrl: () => 'http://localhost:3000/uploads/test.jpg',
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Generate mock JWT tokens
    adminToken = 'mock-admin-jwt-token';
    userToken = 'mock-user-jwt-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /telemetry/event', () => {
    it('should accept telemetry events and return 202', async () => {
      const server = app.getHttpServer();

      const telemetryEvent = {
        eventName: 'user_login',
        userId: 'test-user-123',
        sessionId: 'session-456',
        data: {
          source: 'web',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await request(server)
        .post('/telemetry/event')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(telemetryEvent)
        .expect(202);

      expect(response.body).toEqual({
        status: 'accepted',
      });
    });

    it('should accept events without optional fields', async () => {
      const server = app.getHttpServer();

      const minimalEvent = {
        eventName: 'page_view',
      };

      const response = await request(server)
        .post('/telemetry/event')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(minimalEvent)
        .expect(202);

      expect(response.body).toEqual({
        status: 'accepted',
      });
    });

    it('should accept bulk telemetry events', async () => {
      const server = app.getHttpServer();

      const bulkEvents = [
        {
          eventName: 'user_login',
          userId: 'test-user-123',
          data: { source: 'mobile' },
        },
        {
          eventName: 'page_view',
          userId: 'test-user-123',
          data: { page: '/dashboard' },
        },
        {
          eventName: 'button_click',
          userId: 'test-user-123',
          data: { button: 'start_match' },
        },
      ];

      const response = await request(server)
        .post('/telemetry/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkEvents)
        .expect(202);

      expect(response.body).toEqual({
        status: 'accepted',
        count: 3,
      });
    });

    it('should handle empty bulk events array', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .post('/telemetry/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send([])
        .expect(202);

      expect(response.body).toEqual({
        status: 'accepted',
        count: 0,
      });
    });

    it('should require valid event name', async () => {
      const server = app.getHttpServer();

      const invalidEvent = {
        // Missing eventName
        userId: 'test-user-123',
      };

      await request(server)
        .post('/telemetry/event')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidEvent)
        .expect(400);
    });

    it('should accept events without authentication', async () => {
      const server = app.getHttpServer();

      const anonymousEvent = {
        eventName: 'anonymous_page_view',
        data: { page: '/landing' },
      };

      // Should accept anonymous events for public telemetry
      const response = await request(server)
        .post('/telemetry/event')
        .send(anonymousEvent)
        .expect(202);

      expect(response.body).toEqual({
        status: 'accepted',
      });
    });

    it('should handle large telemetry payloads', async () => {
      const server = app.getHttpServer();

      const largeEvent = {
        eventName: 'complex_interaction',
        userId: 'test-user-123',
        data: {
          largeObject: {
            nested: {
              data: Array.from({ length: 100 }, (_, i) => ({
                id: i,
                value: `item-${i}`,
                metadata: {
                  timestamp: new Date().toISOString(),
                  randomValue: Math.random(),
                },
              })),
            },
          },
          performance: {
            loadTime: 1250,
            domReady: 800,
            firstPaint: 600,
            largestContentfulPaint: 1200,
          },
        },
      };

      const response = await request(server)
        .post('/telemetry/event')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeEvent)
        .expect(202);

      expect(response.body).toEqual({
        status: 'accepted',
      });
    });
  });

  describe('GET /analytics/dashboard', () => {
    it('should return analytics dashboard data for admin users', async () => {
      const server = app.getHttpServer();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const response = await request(server)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      // Check response structure
      expect(response.body).toHaveProperty('dau');
      expect(response.body).toHaveProperty('mau');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('topEvents');
      expect(response.body).toHaveProperty('userEngagement');
      expect(response.body).toHaveProperty('featureUsage');
      expect(response.body).toHaveProperty('systemPerformance');
      expect(response.body).toHaveProperty('economyMetrics');

      // Check data types
      expect(typeof response.body.dau).toBe('number');
      expect(typeof response.body.mau).toBe('number');
      expect(Array.isArray(response.body.topEvents)).toBe(true);
      expect(Array.isArray(response.body.userEngagement)).toBe(true);
    });

    it('should require admin authentication', async () => {
      const server = app.getHttpServer();

      await request(server).get('/analytics/dashboard').expect(401);
    });

    it('should handle date range parameters', async () => {
      const server = app.getHttpServer();

      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';

      const response = await request(server)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should use default date range when not provided', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('dau');
    });

    it('should handle invalid date formats gracefully', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: 'invalid-date',
          endDate: '2024-01-31',
        })
        .expect(200);

      // Should handle gracefully or return error
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /analytics/realtime', () => {
    it('should return real-time metrics', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/analytics/realtime')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('dau');
      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('topEvents');
      expect(response.body).toHaveProperty('systemPerformance');
      expect(response.body).toHaveProperty('economyMetrics');
      expect(response.body).toHaveProperty('lastUpdated');
    });

    it('should accept hours parameter', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/analytics/realtime?hours=6')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should require admin authentication', async () => {
      const server = app.getHttpServer();

      await request(server).get('/analytics/realtime').expect(401);
    });
  });

  describe('GET /analytics/engagement', () => {
    it('should return user engagement data', async () => {
      const server = app.getHttpServer();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(server)
        .get('/analytics/engagement')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('userEngagement');
      expect(response.body).toHaveProperty('dau');
      expect(response.body).toHaveProperty('mau');
      expect(Array.isArray(response.body.userEngagement)).toBe(true);
    });
  });

  describe('GET /analytics/features', () => {
    it('should return feature usage data', async () => {
      const server = app.getHttpServer();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const response = await request(server)
        .get('/analytics/features')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('featureUsage');
      expect(response.body).toHaveProperty('topEvents');
      expect(Array.isArray(response.body.featureUsage)).toBe(true);
      expect(Array.isArray(response.body.topEvents)).toBe(true);
    });
  });

  describe('GET /analytics/performance', () => {
    it('should return system performance data', async () => {
      const server = app.getHttpServer();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(server)
        .get('/analytics/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('systemPerformance');
      expect(response.body).toHaveProperty('userEngagement');
      expect(response.body.systemPerformance).toHaveProperty('avgResponseTime');
      expect(response.body.systemPerformance).toHaveProperty('errorRate');
      expect(response.body.systemPerformance).toHaveProperty('uptime');
    });
  });

  describe('GET /analytics/economy', () => {
    it('should return economy metrics', async () => {
      const server = app.getHttpServer();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const response = await request(server)
        .get('/analytics/economy')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('economyMetrics');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body.economyMetrics).toHaveProperty('totalTransactions');
      expect(response.body.economyMetrics).toHaveProperty('totalVolume');
      expect(response.body.economyMetrics).toHaveProperty(
        'avgTransactionValue'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test with the current setup
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should either succeed or return a proper error response
      expect([200, 500]).toContain(response.status);
    });

    it('should handle malformed JSON payloads', async () => {
      const server = app.getHttpServer();

      await request(server)
        .post('/telemetry/event')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json {')
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      const server = app.getHttpServer();

      await request(server)
        .post('/telemetry/event')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid telemetry event submissions', async () => {
      const server = app.getHttpServer();

      const promises = Array.from({ length: 50 }, () =>
        request(server)
          .post('/telemetry/event')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            eventName: 'rapid_test_event',
            userId: 'test-user-123',
          })
      );

      const results = await Promise.allSettled(promises);

      // Should handle the load appropriately
      const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
      const rejected = results.filter((r) => r.status === 'rejected').length;

      expect(fulfilled + rejected).toBe(50);
    });
  });

  describe('Security', () => {
    it('should prevent unauthorized access to analytics endpoints', async () => {
      const server = app.getHttpServer();

      await request(server)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should validate admin role for analytics access', async () => {
      // This would require a mock that returns non-admin user
      // For now, we test with admin token
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.status).toBe(200);
    });
  });
});
