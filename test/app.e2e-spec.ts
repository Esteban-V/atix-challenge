import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/ (POST)', () => {
    it('should return 201', () => {
      const message = { message: 'Hola Mundo' };
      return request(app.getHttpServer())
        .post('/')
        .send(message)
        .expect(({ text }) => {
          expect(text).toBe('true');
        })
        .expect(201);
    });
  });

  describe('/ (POST)', () => {
    it('should return 400', () => {
      return request(app.getHttpServer()).post('/').expect(400);
    });
  });
});
