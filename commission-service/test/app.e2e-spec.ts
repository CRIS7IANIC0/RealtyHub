import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma.service';

/** Integración del commission-service: evento de RabbitMQ (simulado) → persistencia → API HTTP. */
describe('commission-service (integración)', () => {
  let app: INestApplication<App>;
  let controller: AppController;
  const store: any[] = [];
  const prisma = {
    commission: {
      findFirst: jest.fn(({ where }) => Promise.resolve(store.find((c) => c.contract_id === where.contract_id) ?? null)),
      create: jest.fn(({ data }) => {
        const row = { id: `m${store.length + 1}`, created_at: new Date().toISOString(), ...data };
        store.push(row);
        return Promise.resolve(row);
      }),
      findMany: jest.fn(() => Promise.resolve([...store])),
      update: jest.fn(({ where, data }) => {
        const row = store.find((c) => c.id === where.id);
        Object.assign(row, data);
        return Promise.resolve(row);
      }),
    },
  };

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    controller = moduleRef.get(AppController);
  });

  afterAll(async () => app.close());

  it('contract.signed genera la comisión, GET /commissions la lista y PATCH /:id/pay la marca Pagada', async () => {
    await controller.handleContractSigned({ id: 'c9', price: 2000000, agent_id: 'u3' });

    const list = await request(app.getHttpServer()).get('/commissions').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ contract_id: 'c9', amount: 100000, status: 'Pendiente' });

    const paid = await request(app.getHttpServer()).patch(`/commissions/${list.body[0].id}/pay`).expect(200);
    expect(paid.body.status).toBe('Pagada');
  });
});
