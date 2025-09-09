import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { AuthService } from '../../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LOMSController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;
  let adminToken: string;
  let regularUserToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();

    // Create test users and get tokens
    const adminUser = await prismaService.user.create({
      data: {
        id: 'admin-test-user',
        email: 'admin@test.com',
        username: 'adminuser',
        passwordHash: 'hashedpassword',
        role: 'ADMIN',
      },
    });

    const regularUser = await prismaService.user.create({
      data: {
        id: 'regular-test-user',
        email: 'user@test.com',
        username: 'regularuser',
        passwordHash: 'hashedpassword',
        role: 'USER',
      },
    });

    // Mock JWT tokens (in real scenario, you'd get these from auth service)
    adminToken = 'mock-admin-jwt-token';
    regularUserToken = 'mock-regular-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: {
        id: {
          in: ['admin-test-user', 'regular-test-user'],
        },
      },
    });

    await app.close();
  });

  describe('/loms/live (GET)', () => {
    it('should return live content for authenticated users', () => {
      return request(app.getHttpServer())
        .get('/loms/live')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('promotions');
          expect(res.body).toHaveProperty('news');
          expect(res.body).toHaveProperty('lastUpdated');
          expect(Array.isArray(res.body.events)).toBe(true);
          expect(Array.isArray(res.body.promotions)).toBe(true);
          expect(Array.isArray(res.body.news)).toBe(true);
        });
    });

    it('should return live content without authentication', () => {
      return request(app.getHttpServer())
        .get('/loms/live')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('promotions');
          expect(res.body).toHaveProperty('news');
          expect(res.body).toHaveProperty('lastUpdated');
        });
    });
  });

  describe('/loms/events (POST)', () => {
    const createEventDto = {
      title: 'Test Tournament Event',
      description: 'A test tournament event',
      eventType: 'TOURNAMENT',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T18:00:00Z',
      priority: 1,
      targetAudience: ['ALL'],
      rewards: { coins: 100, experience: 50 },
      requirements: { minLevel: 1 },
      tags: ['tournament', 'test'],
    };

    it('should create event for admin user', () => {
      return request(app.getHttpServer())
        .post('/loms/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createEventDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('contentId');
          expect(res.body.eventType).toBe('TOURNAMENT');
          expect(res.body.content.title).toBe('Test Tournament Event');
          expect(res.body.content.description).toBe('A test tournament event');
        });
    });

    it('should reject event creation for non-admin user', () => {
      return request(app.getHttpServer())
        .post('/loms/events')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(createEventDto)
        .expect(403);
    });

    it('should reject event creation without authentication', () => {
      return request(app.getHttpServer())
        .post('/loms/events')
        .send(createEventDto)
        .expect(401);
    });

    it('should validate required fields', () => {
      const invalidEventDto = {
        title: 'Test Event',
        // Missing required eventType and startTime
      };

      return request(app.getHttpServer())
        .post('/loms/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidEventDto)
        .expect(400);
    });
  });

  describe('/loms/events (GET)', () => {
    beforeAll(async () => {
      // Create test events
      await prismaService.content.create({
        data: {
          id: 'test-content-1',
          title: 'Test Event 1',
          description: 'Description 1',
          contentType: 'EVENT',
          status: 'APPROVED',
          visibility: 'PUBLIC',
          userId: 'admin-test-user',
          metadata: JSON.stringify({
            eventType: 'TOURNAMENT',
            startTime: '2024-01-01T10:00:00Z',
            endTime: '2024-01-01T18:00:00Z',
          }),
          tags: JSON.stringify(['test']),
        },
      });

      await prismaService.event.create({
        data: {
          id: 'test-event-1',
          contentId: 'test-content-1',
          eventType: 'TOURNAMENT',
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2024-01-01T18:00:00Z'),
          isActive: true,
          priority: 1,
          targetAudience: ['ALL'],
          rewards: { coins: 100 },
          requirements: { minLevel: 1 },
          createdBy: 'admin-test-user',
        },
      });
    });

    afterAll(async () => {
      // Clean up test data
      await prismaService.event.deleteMany({
        where: { createdBy: 'admin-test-user' },
      });
      await prismaService.content.deleteMany({
        where: { userId: 'admin-test-user' },
      });
    });

    it('should return events list for admin user', () => {
      return request(app.getHttpServer())
        .get('/loms/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('totalCount');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.events)).toBe(true);
        });
    });

    it('should reject events list for non-admin user', () => {
      return request(app.getHttpServer())
        .get('/loms/events')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/loms/events?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.pagination.page).toBe(1);
          expect(res.body.pagination.limit).toBe(10);
        });
    });

    it('should support filtering by active status', () => {
      return request(app.getHttpServer())
        .get('/loms/events?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('/loms/events/:id (GET)', () => {
    it('should return single event for admin user', () => {
      return request(app.getHttpServer())
        .get('/loms/events/test-event-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('contentId');
          expect(res.body).toHaveProperty('eventType');
          expect(res.body).toHaveProperty('content');
        });
    });

    it('should reject single event access for non-admin user', () => {
      return request(app.getHttpServer())
        .get('/loms/events/test-event-1')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent event', () => {
      return request(app.getHttpServer())
        .get('/loms/events/non-existent-event')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/loms/events/:id (PUT)', () => {
    const updateEventDto = {
      title: 'Updated Test Event',
      description: 'Updated description',
      eventType: 'SPECIAL_EVENT',
      startTime: '2024-01-02T10:00:00Z',
      endTime: '2024-01-02T18:00:00Z',
      priority: 2,
      isActive: false,
      tags: ['updated', 'test'],
    };

    it('should update event for admin user', () => {
      return request(app.getHttpServer())
        .put('/loms/events/test-event-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateEventDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.content.title).toBe('Updated Test Event');
          expect(res.body.eventType).toBe('SPECIAL_EVENT');
          expect(res.body.priority).toBe(2);
          expect(res.body.isActive).toBe(false);
        });
    });

    it('should reject event update for non-admin user', () => {
      return request(app.getHttpServer())
        .put('/loms/events/test-event-1')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(updateEventDto)
        .expect(403);
    });

    it('should validate update data', () => {
      const invalidUpdateDto = {
        title: '', // Invalid empty title
        eventType: 'INVALID_TYPE',
      };

      return request(app.getHttpServer())
        .put('/loms/events/test-event-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdateDto)
        .expect(400);
    });
  });

  describe('/loms/events/:id (DELETE)', () => {
    it('should delete event for admin user', () => {
      return request(app.getHttpServer())
        .delete('/loms/events/test-event-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should reject event deletion for non-admin user', () => {
      return request(app.getHttpServer())
        .delete('/loms/events/test-event-1')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should return 404 when deleting non-existent event', () => {
      return request(app.getHttpServer())
        .delete('/loms/events/non-existent-event')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/loms/promotions (POST)', () => {
    const createPromotionDto = {
      title: 'Test Promotion',
      description: 'A test promotion',
      code: 'TEST2024',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minPurchase: 25,
      maxUses: 50,
      isActive: true,
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-12-31T23:59:59Z',
      targetUsers: ['ALL'],
      applicableItems: ['ALL'],
      tags: ['test', 'promotion'],
    };

    it('should create promotion for admin user', () => {
      return request(app.getHttpServer())
        .post('/loms/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createPromotionDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('contentId');
          expect(res.body.code).toBe('TEST2024');
          expect(res.body.discountType).toBe('PERCENTAGE');
          expect(res.body.discountValue).toBe(15);
          expect(res.body.content.title).toBe('Test Promotion');
        });
    });

    it('should reject duplicate promotion codes', async () => {
      // First create a promotion
      await request(app.getHttpServer())
        .post('/loms/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createPromotionDto)
        .expect(201);

      // Try to create another with same code
      return request(app.getHttpServer())
        .post('/loms/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createPromotionDto)
        .expect(500); // Database constraint violation
    });

    it('should validate promotion data', () => {
      const invalidPromotionDto = {
        title: 'Test Promotion',
        code: 'TEST',
        discountType: 'INVALID_TYPE',
        discountValue: -10, // Invalid negative value
      };

      return request(app.getHttpServer())
        .post('/loms/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidPromotionDto)
        .expect(400);
    });
  });

  describe('/loms/news (POST)', () => {
    const createNewsItemDto = {
      title: 'Test News Item',
      description: 'A test news item',
      category: 'UPDATE',
      priority: 1,
      isPublished: true,
      publishTime: '2024-01-01T00:00:00Z',
      expiryTime: '2024-12-31T23:59:59Z',
      targetPlatform: ['WEB', 'MOBILE'],
      tags: ['test', 'news'],
    };

    it('should create news item for admin user', () => {
      return request(app.getHttpServer())
        .post('/loms/news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createNewsItemDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('contentId');
          expect(res.body.category).toBe('UPDATE');
          expect(res.body.priority).toBe(1);
          expect(res.body.isPublished).toBe(true);
          expect(res.body.content.title).toBe('Test News Item');
        });
    });

    it('should validate news item data', () => {
      const invalidNewsDto = {
        title: 'Test News',
        category: 'INVALID_CATEGORY',
        priority: -1, // Invalid negative priority
      };

      return request(app.getHttpServer())
        .post('/loms/news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidNewsDto)
        .expect(400);
    });
  });

  describe('/loms/assets (POST)', () => {
    const createAssetBundleDto = {
      title: 'Test Asset Bundle',
      description: 'A test asset bundle',
      bundleType: 'AVATAR_ITEMS',
      version: '1.0.0',
      isActive: true,
      downloadUrl: 'https://cdn.example.com/bundles/test-1.0.0.zip',
      fileSize: 1048576, // 1MB
      checksum: 'abc123def456',
      minAppVersion: '2.0.0',
      targetPlatform: ['WEB', 'MOBILE'],
      dependencies: [],
      tags: ['test', 'avatar'],
    };

    it('should create asset bundle for admin user', () => {
      return request(app.getHttpServer())
        .post('/loms/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createAssetBundleDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('contentId');
          expect(res.body.bundleType).toBe('AVATAR_ITEMS');
          expect(res.body.version).toBe('1.0.0');
          expect(res.body.content.title).toBe('Test Asset Bundle');
        });
    });

    it('should validate asset bundle data', () => {
      const invalidAssetDto = {
        title: 'Test Bundle',
        bundleType: 'INVALID_TYPE',
        version: '', // Invalid empty version
      };

      return request(app.getHttpServer())
        .post('/loms/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidAssetDto)
        .expect(400);
    });
  });
});
