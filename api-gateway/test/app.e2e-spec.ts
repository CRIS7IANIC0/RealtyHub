import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';

/** Integración del api-gateway: HTTP real de Nest + reenvío a los microservicios (fetch simulado). */
describe('api-gateway (integración HTTP)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-prueba';
    const moduleRef = await Test.createTestingModule({ controllers: [AppController] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => app.close());
  afterEach(() => jest.restoreAllMocks());

  it('GET /api/v1/properties reenvía al property-service y, si éste cae, responde [] sin romper', async () => {
    const spy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'p1', title: 'Casa' }] } as Response);
    const ok = await request(app.getHttpServer()).get('/api/v1/properties').expect(200);
    expect(ok.body).toEqual([{ id: 'p1', title: 'Casa' }]);
    expect(String(spy.mock.calls[0][0])).toMatch(/\/properties$/);

    spy.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const caido = await request(app.getHttpServer()).get('/api/v1/properties').expect(200);
    expect(caido.body).toEqual([]);
  });
});
