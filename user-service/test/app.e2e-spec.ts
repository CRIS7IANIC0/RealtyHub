import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma.service';

/**
 * Integración del user-service: capa HTTP real de Nest (rutas, pipes, filtros de
 * excepción) + controlador + util JWT, con Prisma simulado (no requiere Postgres).
 */
describe('user-service (integración HTTP)', () => {
  let app: INestApplication<App>;
  const prisma = { user: { findFirst: jest.fn() }, office: {} };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-prueba';
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('POST /users/login: 201 con token si es válido, 401 si la clave es incorrecta, 403 si está desactivada', async () => {
    const user = { id: 'u1', name: 'Gerente', email: 'g@realtyhub.com', password: 'abc', role: 'GERENTE', active: true, office_id: 'o1' };

    prisma.user.findFirst.mockResolvedValueOnce(user);
    const ok = await request(app.getHttpServer()).post('/users/login').send({ email: 'g@realtyhub.com', password: 'abc' }).expect(201);
    expect(ok.body.token).toBeDefined();
    expect(ok.body.password).toBeUndefined();

    prisma.user.findFirst.mockResolvedValueOnce(user);
    await request(app.getHttpServer()).post('/users/login').send({ email: 'g@realtyhub.com', password: 'mala' }).expect(401);

    prisma.user.findFirst.mockResolvedValueOnce({ ...user, active: false });
    await request(app.getHttpServer()).post('/users/login').send({ email: 'g@realtyhub.com', password: 'abc' }).expect(403);
  });
});
