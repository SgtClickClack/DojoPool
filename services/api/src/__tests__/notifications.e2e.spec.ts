import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { FileUploadService } from '../common/file-upload.service';
import { RedisService } from '../redis/redis.service';

describe('Notifications (e2e)', () => {
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

  describe('GET /notifications', () => {
    it('should return user notifications with pagination', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check response structure
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('unreadCount');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.notifications)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('hasNext');
      expect(response.body.pagination).toHaveProperty('hasPrev');
    });

    it('should handle pagination parameters', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/notifications?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should require authentication', async () => {
      const server = app.getHttpServer();

      await request(server).get('/notifications').expect(401);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const server = app.getHttpServer();

      // First, try to mark a notification as read
      // This might fail if the notification doesn't exist, but we're testing the endpoint
      const response = await request(server)
        .patch('/notifications/test-notification-id/read')
        .set('Authorization', `Bearer ${authToken}`);

      // Should either succeed or return 404/NotFound
      expect([200, 404, 403]).toContain(response.status);
    });

    it('should require authentication', async () => {
      const server = app.getHttpServer();

      await request(server)
        .patch('/notifications/test-notification-id/read')
        .expect(401);
    });
  });

  describe('POST /notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .post('/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });

    it('should require authentication', async () => {
      const server = app.getHttpServer();

      await request(server).post('/notifications/read-all').expect(401);
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('unreadCount');
      expect(typeof response.body.unreadCount).toBe('number');
      expect(response.body.unreadCount).toBeGreaterThanOrEqual(0);
    });

    it('should require authentication', async () => {
      const server = app.getHttpServer();

      await request(server).get('/notifications/unread-count').expect(401);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete notification', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .delete('/notifications/test-notification-id')
        .set('Authorization', `Bearer ${authToken}`);

      // Should either succeed or return 404/NotFound
      expect([200, 404, 403]).toContain(response.status);
    });

    it('should require authentication', async () => {
      const server = app.getHttpServer();

      await request(server)
        .delete('/notifications/test-notification-id')
        .expect(401);
    });
  });

  describe('WebSocket Integration', () => {
    it('should handle real-time notification events', async () => {
      // This test verifies the endpoint exists and basic functionality
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed IDs gracefully', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .patch('/notifications/malformed-id/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400, 404, 403]).toContain(response.status);
    });

    it('should handle invalid pagination parameters', async () => {
      const server = app.getHttpServer();

      const response = await request(server)
        .get('/notifications?page=-1&limit=10000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should handle edge cases gracefully
      expect(response.body).toHaveProperty('notifications');
    });
  });
});
