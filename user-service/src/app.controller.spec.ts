import { HttpException, HttpStatus } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

/** Pruebas unitarias del user-service (Prisma simulado, sin base de datos). */
describe('AppController (unit) — user-service', () => {
  let controller: AppController;
  const prisma = {
    user: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    office: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.JWT_SECRET = 'secreto-de-prueba';
    controller = new AppController(prisma as unknown as PrismaService);
  });

  it('login correcto devuelve un JWT y nunca expone la contraseña', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      name: 'Admin',
      email: 'admin@realtyhub.com',
      password: '123456',
      role: 'admin',
      active: true,
      office_id: 'o1',
    });

    const res = await controller.login({ email: 'ADMIN@realtyhub.com ', password: '123456' });

    expect(res.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // formato JWT (3 partes)
    expect(res.role).toBe('ADMIN'); // el rol se normaliza a mayúsculas
    expect(res).not.toHaveProperty('password');
    // El email se normaliza antes de consultar
    expect(prisma.user.findFirst.mock.calls[0][0].where.email.equals).toBe('admin@realtyhub.com');
  });

  it('registrar un correo que ya existe responde 409 Conflict', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

    const attempt = controller.registerUser({ name: 'Ana', email: 'A@B.com' });

    await expect(attempt).rejects.toBeInstanceOf(HttpException);
    await expect(attempt).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
