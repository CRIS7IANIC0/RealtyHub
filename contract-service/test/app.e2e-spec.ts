import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { of } from 'rxjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma.service';

/**
 * Integración del contract-service: HTTP real de Nest + controlador + inyección de los
 * 4 clientes RabbitMQ (simulados). Verifica el patrón fanout de contract.signed.
 */
describe('contract-service (integración HTTP)', () => {
  let app: INestApplication<App>;
  const prisma = { contract: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn() } };
  const clients = ['SALES_SERVICE', 'NOTIFICATIONS_SERVICE', 'ANALYTICS_SERVICE', 'PROPERTY_SERVICE'].map((name) => ({
    name,
    emit: jest.fn(() => of(true)),
  }));

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        ...clients.map((c) => ({ provide: c.name, useValue: c })),
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('PATCH /contracts/:id/status: Pendiente→Firmado dispara el fanout; repetir el estado no; 404 si no existe', async () => {
    prisma.contract.findUnique.mockResolvedValueOnce({ id: 'c1', status: 'Pendiente', price: 100 });
    prisma.contract.update.mockImplementation(({ data }) => Promise.resolve({ id: 'c1', price: 100, ...data }));
    const res = await request(app.getHttpServer()).patch('/contracts/c1/status').send({ status: 'Firmado' }).expect(200);
    expect(res.body.status).toBe('Firmado');
    clients.forEach((c) => expect(c.emit).toHaveBeenCalledWith('contract.signed', expect.objectContaining({ id: 'c1' })));

    clients.forEach((c) => c.emit.mockClear());
    prisma.contract.findUnique.mockResolvedValueOnce({ id: 'c1', status: 'Firmado' });
    await request(app.getHttpServer()).patch('/contracts/c1/status').send({ status: 'Firmado' }).expect(200);
    clients.forEach((c) => expect(c.emit).not.toHaveBeenCalled());

    prisma.contract.findUnique.mockResolvedValueOnce(null);
    await request(app.getHttpServer()).patch('/contracts/x/status').send({ status: 'Firmado' }).expect(404);
  });
});
