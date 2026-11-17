import { BadRequestException } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

/** Pruebas unitarias del property-service (Prisma simulado). */
describe('AppController (unit) — property-service', () => {
  let controller: AppController;
  const prisma = { property: { create: jest.fn(), update: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() } };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    prisma.property.create.mockImplementation(({ data }) => Promise.resolve({ id: 'p1', ...data }));
    controller = new AppController(prisma as unknown as PrismaService);
  });

  it('al crear, infiere operación, tipo y ciudad cuando el cliente no los envía', async () => {
    await controller.createProperty({
      title: 'Casa en alquiler amplia',
      description: 'Arriendo mensual, patio grande',
      address: 'Calle 27 #3-45, Montería',
      price: '2500000',
    });

    const data = prisma.property.create.mock.calls[0][0].data;
    expect(data.operation).toBe('Alquiler'); // detecta "alquiler/arriendo"
    expect(data.property_type).toBe('Casa');
    expect(data.city).toBe('Montería'); // última parte de la dirección
    expect(data.status).toBe('Disponible');
    expect(data.price).toBe(2500000); // el precio llega como número
  });

  it('rechaza precios inválidos y estados fuera del catálogo', async () => {
    await expect(
      controller.createProperty({ title: 'X', address: 'Y', price: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(controller.updateStatus('p1', { status: 'Inexistente' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.property.create).not.toHaveBeenCalled();
    expect(prisma.property.update).not.toHaveBeenCalled();
  });
});
