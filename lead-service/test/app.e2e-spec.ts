import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma.service';

/** Integración del lead-service: HTTP real de Nest + controlador (Prisma simulado). */
describe('lead-service (integración HTTP)', () => {
  let app: INestApplication<App>;
  const prisma = { lead: { create: jest.fn(), findMany: jest.fn() } };

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('POST /leads crea el lead (201) y GET /leads lo devuelve', async () => {
    prisma.lead.create.mockImplementation(({ data }) => Promise.resolve({ id: 'l1', ...data }));
    const created = await request(app.getHttpServer())
      .post('/leads')
      .send({ name: 'Carlos', email: 'c@correo.com', phone: '3100000000', property_id: 'p1', source: 'Web' })
      .expect(201);
    expect(created.body).toMatchObject({ id: 'l1', status: 'Nuevo', name: 'Carlos' });

    prisma.lead.findMany.mockResolvedValue([created.body]);
    const list = await request(app.getHttpServer()).get('/leads').expect(200);
    expect(list.body[0].id).toBe('l1');
  });
});
