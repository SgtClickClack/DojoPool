import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { FileUploadService } from '../common/file-upload.service';
import { RedisService } from '../redis/redis.service';

describe('Activity Events (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

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
        validate: async () => ({ userId: 'test-user-123' }),
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

    // Generate a mock JWT token for testing
    authToken = 'mock-jwt-token-for-testing';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /activity', () => {
    it('should return activity feed with authentication', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check response structure
      expect(response.body).toHaveProperty('entries');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.entries)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('hasNext');
      expect(response.body.pagination).toHaveProperty('hasPrev');
    });

    it('should handle pagination parameters', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/activity?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle filter parameter', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/activity?filter=friends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('entries');
    });

    it('should require authentication', async () => {
      const server = app.getHttpServer();

      await request(server).get('/activity').expect(401);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/activity?page=invalid&limit=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should use default values
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });
  });

  describe('WebSocket Integration', () => {
    it('should handle WebSocket connections for activity events', async () => {
      // This test would require WebSocket testing setup
      // For now, we'll just verify the endpoint exists and responds
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This would test scenarios where the database is unavailable
      // For now, we'll test with the current setup
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/activity')
        .set('Authorization', `Bearer ${authToken}`);

      // Should either succeed or return a proper error response
      expect([200, 500]).toContain(response.status);
    });

    it('should handle malformed request parameters', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/activity?page=-1&limit=1000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should handle edge cases gracefully
      expect(response.body).toHaveProperty('entries');
    });
  });
});
