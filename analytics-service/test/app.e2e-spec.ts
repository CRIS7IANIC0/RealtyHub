import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma.service';

/** Integración del analytics-service: evento (simulado) → métrica persistida → endpoint HTTP. */
describe('analytics-service (integración)', () => {
  let app: INestApplication<App>;
  let controller: AppController;
  const rows: { revenue_value: number }[] = [];
  const prisma = {
    metric: {
      create: jest.fn(({ data }) => {
        rows.push(data);
        return Promise.resolve(data);
      }),
      findMany: jest.fn(() => Promise.resolve([...rows])),
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

  it('dos eventos contract.signed se reflejan en GET /analytics y en GET / con los mismos totales', async () => {
    await controller.handleContractSigned({ id: 'c1', price: 450000000 });
    await controller.handleContractSigned({ id: 'c2', price: 2500000 });

    const a = await request(app.getHttpServer()).get('/analytics').expect(200);
    const b = await request(app.getHttpServer()).get('/').expect(200);

    expect(a.body).toEqual({ total_revenue: 452500000, total_sales: 2 });
    expect(b.body).toEqual(a.body);
  });
});
