import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { signJwt } from './jwt.util';

@Controller('users')
export class AppController {
  constructor(private readonly prisma: PrismaService) { }

  @Get()
  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        office_id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  @Post('login')
  async login(@Body() body: { email: string; password?: string }) {
    const { email, password } = body || {};
    console.log('🔑 Intento de login para:', email);

    if (!email || !password) {
      throw new HttpException('Email y contraseña requeridos', HttpStatus.UNAUTHORIZED);
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Buscamos el usuario por email
    let user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive',
        },
      },
    });

    // 2. Si no existe en la base de datos pero es una cuenta demo oficial, crearla al vuelo (Cold Start para demos)
    if (!user) {
      if (cleanEmail === 'admin@realtyhub.com' || cleanEmail === 'gerente@realtyhub.com' || cleanEmail === 'agente@realtyhub.com') {
        if (password === '123456') {
          const role = cleanEmail === 'admin@realtyhub.com' ? 'ADMIN' : cleanEmail === 'gerente@realtyhub.com' ? 'GERENTE' : 'AGENTE';
          const name = cleanEmail === 'admin@realtyhub.com' ? 'Administrador Sistema' : cleanEmail === 'gerente@realtyhub.com' ? 'Gerente Comercial' : 'Agente Inmobiliario';

          let defaultOffice = await this.prisma.office.findFirst();
          if (!defaultOffice) {
            defaultOffice = await this.prisma.office.create({
              data: { id: 'oficina-central', name: 'Sede Principal', region: 'Bogotá' },
            });
          }

          user = await this.prisma.user.create({
            data: {
              name,
              email: cleanEmail,
              password: '123456',
              role,
              office_id: defaultOffice.id,
            },
          });
          console.log(`👤 Usuario demo creado automáticamente: ${name} (${role})`);
        }
      }
    }

    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      throw new HttpException('Credenciales inválidas', HttpStatus.UNAUTHORIZED);
    }

    const expectedPassword = user.password || '123456';
    if (password !== expectedPassword) {
      console.log('❌ Contraseña incorrecta para:', email);
      throw new HttpException('Credenciales inválidas', HttpStatus.UNAUTHORIZED);
    }

    console.log('✅ Login exitoso:', user.name, `(${user.role})`);

    const userRole = (user.role || 'AGENTE').toUpperCase();

    // Generar JWT firmado estrictamente con process.env.JWT_SECRET
    const token = signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      office_id: user.office_id,
    });

    // Retornamos el objeto omitiendo la contraseña pero incluyendo el token JWT
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      role: userRole,
      token,
      access_token: token,
    };
  }

  @Post()
  async createUser(@Body() data: { name: string; email: string; role?: string; password?: string; office_id?: string }) {
    return this.handleUserRegistration(data);
  }

  @Post('register')
  async registerUser(@Body() data: { name: string; email: string; role?: string; password?: string; office_id?: string }) {
    return this.handleUserRegistration(data);
  }

  /**
   * Endpoint de inicialización (Cold Start / Seed) para producción.
   * Crea la oficina central y las cuentas maestras (admin, gerente, agente) si no existen.
   */
  @Post('seed')
  async seedInitialData() {
    console.log('🌱 Ejecutando seed inicial para la base de datos de usuarios...');

    // 1. Asegurar oficina principal
    let defaultOffice = await this.prisma.office.findUnique({
      where: { id: 'oficina-central' },
    });

    if (!defaultOffice) {
      defaultOffice = await this.prisma.office.create({
        data: {
          id: 'oficina-central',
          name: 'Sede Principal',
          region: 'Bogotá',
        },
      });
      console.log('🏢 Oficina central creada:', defaultOffice.name);
    }

    const initialUsers = [
      {
        name: 'Administrador Sistema',
        email: 'admin@realtyhub.com',
        role: 'ADMIN',
        password: '123456',
        office_id: defaultOffice.id,
      },
      {
        name: 'Gerente Comercial',
        email: 'gerente@realtyhub.com',
        role: 'GERENTE',
        password: '123456',
        office_id: defaultOffice.id,
      },
      {
        name: 'Agente Inmobiliario',
        email: 'agente@realtyhub.com',
        role: 'AGENTE',
        password: '123456',
        office_id: defaultOffice.id,
      },
    ];

    const results = [];

    for (const u of initialUsers) {
      const existing = await this.prisma.user.findFirst({
        where: { email: { equals: u.email, mode: 'insensitive' } },
      });

      if (!existing) {
        const created = await this.prisma.user.create({ data: u });
        const { password: _, ...clean } = created;
        results.push({ ...clean, action: 'created' });
      } else {
        const { password: _, ...clean } = existing;
        results.push({ ...clean, action: 'already_exists' });
      }
    }

    return {
      message: 'Base de datos de usuarios inicializada exitosamente',
      office: defaultOffice,
      users: results,
    };
  }

  /**
   * Lógica unificada y robusta para la creación/registro de usuarios.
   */
  private async handleUserRegistration(data: { name: string; email: string; role?: string; password?: string; office_id?: string }) {
    if (!data.name || !data.email) {
      throw new HttpException('El nombre y el correo electrónico son obligatorios', HttpStatus.BAD_REQUEST);
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const role = (data.role || (cleanEmail.includes('admin') ? 'ADMIN' : 'AGENTE')).toUpperCase();
    const officeId = data.office_id?.trim() || 'oficina-central';

    console.log('👤 Procesando registro de usuario:', cleanEmail, `(Rol: ${role})`);

    // 1. Verificar si el usuario ya existe para evitar duplicados
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive',
        },
      },
    });

    if (existingUser) {
      throw new HttpException(
        `El usuario con correo '${cleanEmail}' ya está registrado. Puedes iniciar sesión directamente.`,
        HttpStatus.CONFLICT,
      );
    }

    // 2. Verificar o crear la oficina correspondiente
    const officeExists = await this.prisma.office.findUnique({
      where: { id: officeId },
    });

    if (!officeExists) {
      console.log(`🏢 Creando oficina faltante: ${officeId}`);
      await this.prisma.office.create({
        data: {
          id: officeId,
          name: officeId === 'oficina-central' ? 'Sede Principal' : officeId,
          region: 'General',
        },
      });
    }

    // 3. Crear el nuevo usuario
    const created = await this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email: cleanEmail,
        password: data.password || '123456',
        role,
        office_id: officeId,
      },
    });

    const token = signJwt({
      sub: created.id,
      email: created.email,
      name: created.name,
      role: created.role,
      office_id: created.office_id,
    });

    const { password: _, ...withoutPassword } = created;
    return {
      ...withoutPassword,
      token,
      access_token: token,
    };
  }
}