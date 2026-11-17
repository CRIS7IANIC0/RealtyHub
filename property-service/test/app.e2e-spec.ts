import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma.service';

/** Integración del property-service: HTTP real de Nest + controlador (Prisma simulado). */
describe('property-service (integración HTTP)', () => {
  let app: INestApplication<App>;
  const prisma = { property: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() } };

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

  it('GET /properties aplica filtros de la query, GET /properties/:id devuelve 404 si no existe y POST valida el cuerpo', async () => {
    prisma.property.findMany.mockResolvedValue([{ id: 'p1', title: 'Casa' }]);
    const list = await request(app.getHttpServer()).get('/properties?operation=Alquiler&city=Montería').expect(200);
    expect(list.body).toHaveLength(1);
    const where = prisma.property.findMany.mock.calls[0][0].where;
    expect(where.operation).toEqual({ equals: 'Alquiler', mode: 'insensitive' });
    expect(where.city).toEqual({ contains: 'Montería', mode: 'insensitive' });

    prisma.property.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer()).get('/properties/no-existe').expect(404);

    await request(app.getHttpServer()).post('/properties').send({ title: 'Sin precio', address: 'Calle 1' }).expect(400);
  });
});
