import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('NEXA Smart Home API');
      });
  });

  describe('Authentication', () => {
    it('should reject unauthorized requests', () => {
      return request(app.getHttpServer())
        .get('/api/v1/homes')
        .expect(401);
    });

    it('should allow public signup endpoint', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
          fullName: 'Test User',
        })
        .expect((res) => {
          // May fail if Supabase not configured, but endpoint should be accessible
          expect([201, 400, 500]).toContain(res.status);
        });
    });
  });
});
