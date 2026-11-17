import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

/** Pruebas unitarias del notification-service (Prisma y servicios vecinos simulados). */
describe('AppController (unit) — notification-service', () => {
  let controller: AppController;
  const prisma = { notification: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn() } };

  const fakeFetch = (routes: Record<string, unknown>) =>
    jest.spyOn(global, 'fetch').mockImplementation(async (url: unknown) => {
      const key = Object.keys(routes).find((k) => String(url).includes(k));
      return { ok: key !== undefined, json: async () => (key ? routes[key] : null) } as Response;
    });

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    controller = new AppController(prisma as unknown as PrismaService);
  });

  it('contract.signed crea una notificación con los nombres reales del cliente y del agente', async () => {
    fakeFetch({
      '/properties/p1': { title: 'Casa Moderna' },
      '/leads': [{ id: 'l1', name: 'Laura Pérez' }],
      '/users': [{ id: 'u3', name: 'Agente Inmobiliario' }],
    });

    await controller.handleContractSigned({ id: 'c1', price: 450000000, property_id: 'p1', lead_id: 'l1', agent_id: 'u3' });

    const data = prisma.notification.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ type: 'success', is_read: false });
    expect(data.message).toContain('Casa Moderna');
    expect(data.message).toContain('Cliente: Laura Pérez.');
    expect(data.message).toContain('Agente: Agente Inmobiliario.');
  });

  it('si los servicios vecinos fallan igual notifica (con textos genéricos) y "marcar todas" informa cuántas actualizó', async () => {
    fakeFetch({}); // todo responde "no ok"
    await controller.handleContractSigned({ id: 'c2', price: 100, property_id: 'p9' });
    expect(prisma.notification.create.mock.calls[0][0].data.message).toContain('la propiedad');

    prisma.notification.updateMany.mockResolvedValue({ count: 3 });
    await expect(controller.markAllAsRead()).resolves.toEqual({ updated: 3 });
  });
});
