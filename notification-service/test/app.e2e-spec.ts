import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma.service';

/** Integración del notification-service: HTTP real de Nest + controlador (Prisma simulado). */
describe('notification-service (integración HTTP)', () => {
  let app: INestApplication<App>;
  const prisma = { notification: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() } };

  beforeAll(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('GET /notifications lista, PATCH /read-all no choca con /:id/read y marcar una devuelve la actualizada', async () => {
    prisma.notification.findMany.mockResolvedValue([{ id: 'n1', title: 'Contrato', is_read: false }]);
    const list = await request(app.getHttpServer()).get('/notifications').expect(200);
    expect(list.body).toHaveLength(1);

    prisma.notification.updateMany.mockResolvedValue({ count: 1 });
    const all = await request(app.getHttpServer()).patch('/notifications/read-all').expect(200);
    expect(all.body).toEqual({ updated: 1 });
    expect(prisma.notification.update).not.toHaveBeenCalled(); // la ruta fija gana a /:id/read

    prisma.notification.update.mockResolvedValue({ id: 'n1', is_read: true });
    const one = await request(app.getHttpServer()).patch('/notifications/n1/read').expect(200);
    expect(one.body.is_read).toBe(true);
  });
});
