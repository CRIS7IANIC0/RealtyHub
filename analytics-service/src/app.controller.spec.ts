import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

/** Pruebas unitarias del analytics-service (Prisma simulado). */
describe('AppController (unit) — analytics-service', () => {
  let controller: AppController;
  const prisma = { metric: { create: jest.fn(), findMany: jest.fn() } };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    controller = new AppController(prisma as unknown as PrismaService);
  });

  it('contract.signed registra una métrica con el valor del contrato como ingreso', async () => {
    prisma.metric.create.mockResolvedValue({ id: 'm1' });

    await controller.handleContractSigned({ id: 'c1', price: '2500000' });

    expect(prisma.metric.create).toHaveBeenCalledWith({
      data: { event_type: 'contract_signed', revenue_value: 2500000 },
    });
  });

  it('getAnalytics suma ingresos y cuenta ventas; ante un fallo de BD devuelve ceros', async () => {
    prisma.metric.findMany.mockResolvedValueOnce([{ revenue_value: 100 }, { revenue_value: 250.5 }]);
    await expect(controller.getAnalytics()).resolves.toEqual({ total_revenue: 350.5, total_sales: 2 });

    prisma.metric.findMany.mockRejectedValueOnce(new Error('BD caída'));
    await expect(controller.getAnalytics()).resolves.toEqual({ total_revenue: 0, total_sales: 0 });
  });
});
