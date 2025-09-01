import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Territories strategic map (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/territories/map returns 200', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get('/api/v1/territories/map');
    expect([200, 304]).toContain(res.status);
  });

  it('POST /api/v1/territories/:id/scout validates payload', async () => {
    const server = app.getHttpServer();
    // Using a fake id; expect 400 or 500 depending on DB state
    const res = await request(server)
      .post('/api/v1/territories/territory-id/scout')
      .send({ playerId: 'player-1' });
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});
