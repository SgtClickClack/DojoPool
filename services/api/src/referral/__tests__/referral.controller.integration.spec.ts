import { INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EconomyModule } from '../../economy/economy.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReferralModule } from '../referral.module';

describe('ReferralController (Integration)', () => {
  let app: INestApplication;

  const mockUser = {
    userId: 'test-user-id',
    email: 'test@example.com',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ReferralModule,
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

  describe('/api/v1/referral/code (GET)', () => {
    it('should return referral code', () => {
      return request(app.getHttpServer())
        .get('/api/v1/referral/code')
        .set('Authorization', 'Bearer mock-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('referralCode');
          expect(res.body).toHaveProperty('createdAt');
          expect(typeof res.body.referralCode).toBe('string');
          expect(res.body.referralCode.length).toBe(8);
        });
    });
  });

  describe('/api/v1/referral/status (GET)', () => {
    it('should return referral status and details', () => {
      return request(app.getHttpServer())
        .get('/api/v1/referral/status')
        .set('Authorization', 'Bearer mock-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('stats');
          expect(res.body).toHaveProperty('details');
          expect(res.body.stats).toHaveProperty('totalReferrals');
          expect(res.body.stats).toHaveProperty('completedReferrals');
          expect(res.body.stats).toHaveProperty('pendingRewards');
          expect(res.body.stats).toHaveProperty('claimedRewards');
          expect(res.body.stats).toHaveProperty('totalEarned');
          expect(Array.isArray(res.body.details)).toBe(true);
        });
    });
  });

  describe('/api/v1/referral/validate (POST)', () => {
    it('should validate referral code', () => {
      const validationData = {
        referralCode: 'VALID123',
      };

      return request(app.getHttpServer())
        .post('/api/v1/referral/validate')
        .send(validationData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('valid');
          expect(res.body).toHaveProperty('referralCode', 'VALID123');
          expect(typeof res.body.valid).toBe('boolean');
        });
    });

    it('should reject validation without referral code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/referral/validate')
        .send({})
        .expect(400);
    });
  });

  describe('/api/v1/referral/process-signup (POST)', () => {
    it('should process referral signup', () => {
      const signupData = {
        referralCode: 'VALID123',
      };

      return request(app.getHttpServer())
        .post('/api/v1/referral/process-signup')
        .set('Authorization', 'Bearer mock-token')
        .send(signupData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should reject signup without referral code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/referral/process-signup')
        .set('Authorization', 'Bearer mock-token')
        .send({})
        .expect(400);
    });
  });
});
