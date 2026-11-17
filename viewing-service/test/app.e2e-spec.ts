import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma.service';

/** Integración del viewing-service: HTTP real de Nest + controlador (Prisma simulado). */
describe('viewing-service (integración HTTP)', () => {
  let app: INestApplication<App>;
  const prisma = { viewing: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() } };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('POST /viewings agenda (201); repetir el mismo horario responde 400; sin campos obligatorios 400; PATCH take asigna', async () => {
    const body = { property_id: 'p1', lead_id: 'l1', scheduled_at: '2026-10-20T15:00:00Z' };

    prisma.viewing.findFirst.mockResolvedValueOnce(null);
    prisma.viewing.create.mockImplementation(({ data }) => Promise.resolve({ id: 'v1', ...data }));
    const ok = await request(app.getHttpServer()).post('/viewings').send(body).expect(201);
    expect(ok.body.status).toBe('Pendiente');

    prisma.viewing.findFirst.mockResolvedValueOnce({ id: 'v1' });
    await request(app.getHttpServer()).post('/viewings').send(body).expect(400);

    await request(app.getHttpServer()).post('/viewings').send({ property_id: 'p1' }).expect(400);

    prisma.viewing.findUnique.mockResolvedValue({ id: 'v1' });
    prisma.viewing.update.mockImplementation(({ data }) => Promise.resolve({ id: 'v1', ...data }));
    const taken = await request(app.getHttpServer()).patch('/viewings/v1/take').send({ agent_id: 'u3' }).expect(200);
    expect(taken.body).toMatchObject({ agent_id: 'u3', status: 'Asignada' });
  });
});
