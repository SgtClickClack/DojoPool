import { INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { EconomyModule } from '../economy.module';

describe('EconomyController (Integration)', () => {
  let app: INestApplication;

  const mockUser = {
    userId: 'test-user-id',
    email: 'test@example.com',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        EconomyModule,
        PrismaModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/economy/balance (GET)', () => {
    it('should return user balance', () => {
      return request(app.getHttpServer())
        .get('/api/v1/economy/balance')
        .set('Authorization', 'Bearer mock-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId');
          expect(res.body).toHaveProperty('balance');
          expect(res.body).toHaveProperty('lastUpdated');
        });
    });
  });

  describe('/api/v1/economy/purchase (POST)', () => {
    it('should process purchase successfully', () => {
      const purchaseData = {
        amount: 100,
        paymentMethod: 'stripe',
        paymentToken: 'tok_123',
      };

      return request(app.getHttpServer())
        .post('/api/v1/economy/purchase')
        .set('Authorization', 'Bearer mock-token')
        .send(purchaseData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('transactionId');
          expect(res.body).toHaveProperty('amount', 100);
          expect(res.body).toHaveProperty('newBalance');
          expect(res.body).toHaveProperty('status', 'COMPLETED');
        });
    });

    it('should reject purchase with invalid amount', () => {
      const purchaseData = {
        amount: 0,
        paymentMethod: 'stripe',
      };

      return request(app.getHttpServer())
        .post('/api/v1/economy/purchase')
        .set('Authorization', 'Bearer mock-token')
        .send(purchaseData)
        .expect(400);
    });

    it('should reject purchase without payment method', () => {
      const purchaseData = {
        amount: 100,
      };

      return request(app.getHttpServer())
        .post('/api/v1/economy/purchase')
        .set('Authorization', 'Bearer mock-token')
        .send(purchaseData)
        .expect(400);
    });
  });

  describe('/api/v1/economy/transactions (GET)', () => {
    it('should return transaction history', () => {
      return request(app.getHttpServer())
        .get('/api/v1/economy/transactions')
        .set('Authorization', 'Bearer mock-token')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/v1/economy/transfer/:toUserId (POST)', () => {
    it('should transfer coins successfully', () => {
      const transferData = {
        amount: 50,
        reason: 'Test transfer',
      };

      return request(app.getHttpServer())
        .post('/api/v1/economy/transfer/user-2')
        .set('Authorization', 'Bearer mock-token')
        .send(transferData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('fromTransaction');
          expect(res.body).toHaveProperty('toTransaction');
        });
    });

    it('should reject transfer without amount', () => {
      const transferData = {
        reason: 'Test transfer',
      };

      return request(app.getHttpServer())
        .post('/api/v1/economy/transfer/user-2')
        .set('Authorization', 'Bearer mock-token')
        .send(transferData)
        .expect(400);
    });
  });
});
