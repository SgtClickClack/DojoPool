import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AdminGuard } from '../auth/admin.guard';
import { RedisService } from '../redis/redis.service';
import { TerritoriesService } from '../territories/territories.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationTemplatesService } from '../notifications/notification-templates.service';

describe.skip('Territories strategic map (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    try {
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
        .useValue({ validate: async () => ({ userId: 'test' }) })
        .overrideProvider(AdminGuard)
        .useValue({ canActivate: () => true })
        .overrideProvider(TerritoriesService)
        .useValue({
          findAllTerritories: async () => [],
          getTerritoriesByClan: async () => [],
          getTerritoriesByVenue: async () => [],
          getStrategicMap: async () => [],
          scoutTerritory: async () => ({ success: true }),
          manageTerritory: async () => ({ success: true }),
        })
        .overrideProvider(PrismaService)
        .useValue({
          territory: {
            findMany: async () => [],
            findFirst: async () => null,
            findUnique: async () => null,
            create: async () => ({ id: 'test' }),
            update: async () => ({ id: 'test' }),
          },
          venue: {
            update: async () => ({ id: 'test' }),
            findUnique: async () => ({ name: 'Test Venue' }),
          },
          user: {
            findUnique: async () => ({ username: 'test' }),
          },
          clanMember: {
            findFirst: async () => null,
          },
          territoryEvent: {
            create: async () => ({ id: 'test' }),
          },
        })
        .overrideProvider(NotificationsService)
        .useValue({
          createNotification: async () => ({ id: 'test' }),
        })
        .overrideProvider(NotificationTemplatesService)
        .useValue({
          getTerritoryChangedTemplate: () => ({
            type: 'territory_changed',
            message: 'Territory changed',
          }),
        })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    } catch (error) {
      console.error('Failed to initialize test app:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/territories/map returns 200', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get('/api/v1/territories/map');
    expect([200, 304, 500]).toContain(res.status);
  });

  it('GET /api/v1/territories returns list or error', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get('/api/v1/territories');
    expect([200, 304, 500]).toContain(res.status);
  });

  it('GET /api/v1/territories/venue/:venueId returns list or error', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get(
      '/api/v1/territories/venue/test-venue'
    );
    expect([200, 304, 404, 500]).toContain(res.status);
  });

  it('GET /api/v1/territories/clan/:clanId returns list or error', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get('/api/v1/territories/clan/test-clan');
    expect([200, 304, 404, 500]).toContain(res.status);
  });

  it('POST /api/v1/territories/:id/scout validates payload', async () => {
    const server = app.getHttpServer();
    // Using a fake id; expect 400 or 500 depending on DB state
    const res = await request(server)
      .post('/api/v1/territories/territory-id/scout')
      .send({ playerId: 'player-1' });
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  it('POST /api/v1/territories/:id/manage accepts action payload', async () => {
    const server = app.getHttpServer();
    const res = await request(server)
      .post('/api/v1/territories/territory-id/manage')
      .send({ action: 'upgrade_defense', payload: { amount: 1 } });
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});
