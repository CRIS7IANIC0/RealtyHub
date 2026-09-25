import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [SEED] Iniciando inicialización de la base de datos user-db...');

  // 1. Crear u obtener la oficina principal
  const defaultOffice = await prisma.office.upsert({
    where: { id: 'oficina-central' },
    update: {},
    create: {
      id: 'oficina-central',
      name: 'Sede Principal',
      region: 'Bogotá',
    },
  });
  console.log('🏢 Oficina confirmada:', defaultOffice.name, `(${defaultOffice.id})`);

  // 2. Usuarios semilla oficiales para RealtyHub
  const initialUsers = [
    {
      email: 'admin@realtyhub.com',
      name: 'Administrador Sistema',
      role: 'ADMIN',
      password: process.env.ADMIN_INITIAL_PASSWORD || '123456',
      office_id: defaultOffice.id,
    },
    {
      email: 'gerente@realtyhub.com',
      name: 'Gerente Comercial',
      role: 'GERENTE',
      password: '123456',
      office_id: defaultOffice.id,
    },
    {
      email: 'agente@realtyhub.com',
      name: 'Agente Inmobiliario',
      role: 'AGENTE',
      password: '123456',
      office_id: defaultOffice.id,
    },
  ];

  for (const user of initialUsers) {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: user.email, mode: 'insensitive' } },
    });

    if (!existing) {
      const created = await prisma.user.create({ data: user });
      console.log(`✅ Usuario creado: ${created.name} <${created.email}> (${created.role})`);
    } else {
      console.log(`ℹ️ Usuario ya existe: ${existing.name} <${existing.email}> (${existing.role})`);
    }
  }

  console.log('🎉 [SEED] Base de datos de usuarios lista para producción.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
