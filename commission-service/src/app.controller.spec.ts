import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

/** Pruebas unitarias del commission-service (Prisma simulado). */
describe('AppController (unit) — commission-service', () => {
  let controller: AppController;
  const prisma = { commission: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() } };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    prisma.commission.create.mockImplementation(({ data }) => Promise.resolve({ id: 'm1', ...data }));
    controller = new AppController(prisma as unknown as PrismaService);
  });

  it('al firmarse un contrato crea una comisión del 5 % en estado Pendiente', async () => {
    prisma.commission.findFirst.mockResolvedValue(null);

    await controller.handleContractSigned({ id: 'c1', price: 1000000, agent_id: 'u3' });

    expect(prisma.commission.create).toHaveBeenCalledWith({
      data: { contract_id: 'c1', agent_id: 'u3', amount: 50000, status: 'Pendiente' },
    });
  });

  it('es idempotente: no duplica la comisión de un contrato y ignora eventos sin id', async () => {
    prisma.commission.findFirst.mockResolvedValue({ id: 'm1', contract_id: 'c1' });

    const existing = await controller.handleContractSigned({ id: 'c1', price: 500 });
    await controller.handleContractSigned({ price: 500 });

    expect(existing).toMatchObject({ id: 'm1' });
    expect(prisma.commission.create).not.toHaveBeenCalled();
  });
});
