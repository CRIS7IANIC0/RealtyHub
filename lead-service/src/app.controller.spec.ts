import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

/** Pruebas unitarias del lead-service (Prisma simulado). */
describe('AppController (unit) — lead-service', () => {
  let controller: AppController;
  const prisma = { lead: { create: jest.fn(), findMany: jest.fn() } };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    controller = new AppController(prisma as unknown as PrismaService);
  });

  it('un lead nuevo queda con estado "Nuevo" si no se indica otro', async () => {
    prisma.lead.create.mockImplementation(({ data }) => Promise.resolve({ id: 'l1', ...data }));

    const lead = await controller.createLead({
      name: 'Laura',
      email: 'laura@correo.com',
      phone: '3001234567',
      property_id: 'p1',
      source: 'Web',
    });

    expect(lead.status).toBe('Nuevo');
    expect(prisma.lead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Laura', source: 'Web', property_id: 'p1' }),
    });
  });

  it('lista los leads del más reciente al más antiguo', async () => {
    prisma.lead.findMany.mockResolvedValue([{ id: 'l2' }, { id: 'l1' }]);

    const leads = await controller.getAllLeads();

    expect(leads).toHaveLength(2);
    expect(prisma.lead.findMany).toHaveBeenCalledWith({ orderBy: { created_at: 'desc' } });
  });
});
