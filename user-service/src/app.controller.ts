import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';

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

    // 2. Si no existe en la base de datos pero es una cuenta demo oficial, crearla al vuelo
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

    // Retornamos el objeto omitiendo la contraseña
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      role: (user.role || 'AGENTE').toUpperCase(),
    };
  }

  @Post()
  async createUser(@Body() data: { name: string; email: string; role?: string; password?: string; office_id: string }) {
    console.log('👤 Guardando nuevo usuario en la base de datos:', data.name);

    // 1. Verificar si la oficina ya existe (para evitar el error de llave foránea)
    const officeExists = await this.prisma.office.findUnique({
      where: { id: data.office_id },
    });

    // 2. Si no existe, la creamos al vuelo
    if (!officeExists) {
      console.log(`🏢 Creando oficina faltante: ${data.office_id}`);
      await this.prisma.office.create({
        data: {
          id: data.office_id, // Guardamos "Oficina Norte" como su ID
          name: data.office_id,
          region: 'General',
        },
      });
    }

    // 3. Ahora sí, creamos al usuario con total seguridad
    const created = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password || '123456',
        role: (data.role || 'AGENTE').toUpperCase(),
        office_id: data.office_id,
      },
    });

    const { password: _, ...withoutPassword } = created;
    return withoutPassword;
  }
}