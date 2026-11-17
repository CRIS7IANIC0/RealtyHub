import { BadRequestException } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

/** Pruebas unitarias del viewing-service (Prisma simulado). */
describe('AppController (unit) — viewing-service', () => {
  let controller: AppController;
  const prisma = { viewing: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() } };

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new AppController(prisma as unknown as PrismaService);
  });

  it('no permite agendar dos visitas en la misma propiedad y hora', async () => {
    prisma.viewing.findFirst.mockResolvedValue({ id: 'v-existente' });

    await expect(
      controller.createViewing({ property_id: 'p1', lead_id: 'l1', scheduled_at: '2026-10-20T15:00:00Z' }),
    ).rejects.toThrow('La propiedad ya tiene una visita en ese horario');
    expect(prisma.viewing.create).not.toHaveBeenCalled();
  });

  it('"tomar visita" asigna al agente y cambia el estado a Asignada', async () => {
    prisma.viewing.findUnique.mockResolvedValue({ id: 'v1', status: 'Pendiente' });
    prisma.viewing.update.mockImplementation(({ data }) => Promise.resolve({ id: 'v1', ...data }));

    const res = await controller.takeViewing('v1', { agent_id: 'u3' });

    expect(res).toMatchObject({ agent_id: 'u3', status: 'Asignada' });
    await expect(controller.takeViewing('v1', { agent_id: '' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
