import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackCategory, FeedbackStatus, UserRole } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('FeedbackController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let userToken: string;
  let adminToken: string;

  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    role: UserRole.USER,
  };

  const testAdmin = {
    id: 'test-admin-id',
    email: 'admin@example.com',
    username: 'admin',
    role: UserRole.ADMIN,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Generate test tokens
    userToken = jwtService.sign({
      userId: testUser.id,
      username: testUser.username,
      role: testUser.role,
    });
    adminToken = jwtService.sign({
      userId: testAdmin.id,
      username: testAdmin.username,
      role: testAdmin.role,
    });

    // Clean up any existing test data
    await prisma.feedback.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    await prisma.user.create({ data: testUser });
    await prisma.user.create({ data: testAdmin });
  });

  afterAll(async () => {
    await prisma.feedback.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('/feedback (POST)', () => {
    it('should create feedback successfully', () => {
      const feedbackData = {
        message: 'Test feedback message',
        category: FeedbackCategory.BUG,
        additionalContext: 'Additional test context',
      };

      return request(app.getHttpServer())
        .post('/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send(feedbackData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.message).toBe(feedbackData.message);
          expect(res.body.category).toBe(feedbackData.category);
          expect(res.body.userId).toBe(testUser.id);
          expect(res.body.status).toBe(FeedbackStatus.PENDING);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/feedback')
        .send({
          message: 'Test message',
          category: FeedbackCategory.BUG,
        })
        .expect(401);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: 'Test message' }) // Missing category
        .expect(400);
    });
  });

  describe('/feedback/my (GET)', () => {
    beforeAll(async () => {
      // Create some test feedback
      await prisma.feedback.create({
        data: {
          userId: testUser.id,
          message: 'My test feedback',
          category: FeedbackCategory.FEATURE_REQUEST,
        },
      });
    });

    it('should return user feedback', () => {
      return request(app.getHttpServer())
        .get('/feedback/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.feedback)).toBe(true);
          expect(res.body.feedback.length).toBeGreaterThan(0);
          expect(res.body.feedback[0].userId).toBe(testUser.id);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/feedback/my?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.pagination.page).toBe(1);
          expect(res.body.pagination.limit).toBe(10);
        });
    });
  });

  describe('/feedback/my/:id (DELETE)', () => {
    let feedbackId: string;

    beforeAll(async () => {
      const feedback = await prisma.feedback.create({
        data: {
          userId: testUser.id,
          message: 'Feedback to delete',
          category: FeedbackCategory.BUG,
        },
      });
      feedbackId = feedback.id;
    });

    it('should delete user feedback', () => {
      return request(app.getHttpServer())
        .delete(`/feedback/my/${feedbackId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });

    it('should return 404 for non-existent feedback', () => {
      return request(app.getHttpServer())
        .delete('/feedback/my/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('/feedback/admin (GET)', () => {
    beforeAll(async () => {
      // Create test feedback for admin view
      await prisma.feedback.create({
        data: {
          userId: testUser.id,
          message: 'Admin test feedback',
          category: FeedbackCategory.TECHNICAL_SUPPORT,
        },
      });
    });

    it('should return all feedback for admin', () => {
      return request(app.getHttpServer())
        .get('/feedback/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.feedback).toBeDefined();
          expect(res.body.totalCount).toBeDefined();
          expect(res.body.pendingCount).toBeDefined();
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('should support filtering', () => {
      return request(app.getHttpServer())
        .get('/feedback/admin?category=TECHNICAL_SUPPORT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(
            res.body.feedback.every(
              (f: any) => f.category === FeedbackCategory.TECHNICAL_SUPPORT
            )
          ).toBe(true);
        });
    });

    it('should return 403 for non-admin users', () => {
      return request(app.getHttpServer())
        .get('/feedback/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/feedback/admin/stats (GET)', () => {
    it('should return feedback statistics for admin', () => {
      return request(app.getHttpServer())
        .get('/feedback/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('pending');
          expect(res.body).toHaveProperty('resolved');
          expect(typeof res.body.total).toBe('number');
        });
    });
  });

  describe('/feedback/admin/:id (PUT)', () => {
    let feedbackId: string;

    beforeAll(async () => {
      const feedback = await prisma.feedback.create({
        data: {
          userId: testUser.id,
          message: 'Feedback to update',
          category: FeedbackCategory.BUG,
        },
      });
      feedbackId = feedback.id;
    });

    it('should update feedback status', () => {
      return request(app.getHttpServer())
        .put(`/feedback/admin/${feedbackId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: FeedbackStatus.IN_REVIEW,
          adminNotes: 'Reviewing this feedback',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(FeedbackStatus.IN_REVIEW);
          expect(res.body.adminNotes).toBe('Reviewing this feedback');
        });
    });

    it('should return 403 for non-admin users', () => {
      return request(app.getHttpServer())
        .put(`/feedback/admin/${feedbackId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: FeedbackStatus.RESOLVED })
        .expect(403);
    });
  });
});
