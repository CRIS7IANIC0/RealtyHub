import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

/** Pruebas unitarias del contract-service (Prisma y RabbitMQ simulados). */
describe('AppController (unit) — contract-service', () => {
  let controller: AppController;
  const prisma = { contract: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() } };
  const queue = () => ({ emit: jest.fn(() => of(true)) });
  const sales = queue();
  const notifications = queue();
  const analytics = queue();
  const property = queue();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    prisma.contract.create.mockImplementation(({ data }) => Promise.resolve({ id: 'c1', ...data }));
    controller = new AppController(
      prisma as unknown as PrismaService,
      sales as never,
      notifications as never,
      analytics as never,
      property as never,
    );
  });

  it('un contrato creado como Firmado guarda signed_at y emite contract.signed a las 4 colas', async () => {
    const contract = await controller.createContract({
      property_id: 'p1',
      lead_id: 'l1',
      agent_id: 'u3',
      price: '450000000',
      type: 'Venta',
      status: 'Firmado',
    });

    expect(contract.signed_at).toBeInstanceOf(Date);
    expect(contract.price).toBe(450000000);
    for (const q of [sales, notifications, analytics, property]) {
      expect(q.emit).toHaveBeenCalledWith('contract.signed', expect.objectContaining({ id: 'c1' }));
    }
  });

  it('rechaza estados desconocidos y un contrato Pendiente no emite eventos', async () => {
    await expect(
      controller.createContract({ property_id: 'p1', lead_id: 'l1', agent_id: 'u3', price: 1, status: 'Cerrado' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const pending = await controller.createContract({ property_id: 'p1', lead_id: 'l1', agent_id: 'u3', price: 1 });
    expect(pending.status).toBe('Pendiente'); // estado inicial por defecto
    expect(pending.signed_at).toBeNull();
    expect(sales.emit).not.toHaveBeenCalled();
  });
});
