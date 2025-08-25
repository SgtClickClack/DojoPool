import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';

async function run() {
  let app: INestApplication | undefined;
  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const server = app.getHttpServer();

    // Test Case 1: Create a New User
    const createPayload = {
      email: 'testuser@example.com',
      username: 'testuser',
      passwordHash: 'a_fake_hashed_password',
    };

    const createRes = await supertest(server)
      .post('/v1/users')
      .set('Content-Type', 'application/json')
      .send(createPayload);

    // eslint-disable-next-line no-console
    console.log('Create User -> Status:', createRes.status);
    // eslint-disable-next-line no-console
    console.log('Create User -> Body:', JSON.stringify(createRes.body, null, 2));

    // Test Case 2: Get All Users
    const getRes = await supertest(server).get('/v1/users');
    // eslint-disable-next-line no-console
    console.log('Get All Users -> Status:', getRes.status);
    // eslint-disable-next-line no-console
    console.log('Get All Users -> Body:', JSON.stringify(getRes.body, null, 2));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (app) {
      await app.close();
    }
  }
}

void run();
