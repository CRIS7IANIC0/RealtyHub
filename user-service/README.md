# User Service

Gestiona al personal de la inmobiliaria: registro, login, activación/desactivación de cuentas y oficinas. Emite los JWT que valida el API Gateway.

**Responsabilidad en la arquitectura:** Usuarios, roles (ADMIN, GERENTE, AGENTE), oficinas e inicio de sesión con JWT.

Parte de **RealtyHub**, plataforma inmobiliaria basada en microservicios. Se comunica con el resto por API REST y por mensajería (RabbitMQ).

## Tecnologías

NestJS · TypeScript · Prisma ORM · PostgreSQL · RabbitMQ · Docker

## Reglas de negocio

- Las contraseñas nunca se devuelven en los listados.
- Una cuenta desactivada no puede iniciar sesión.
- Los correos son únicos (sin distinguir mayúsculas).

## Endpoints principales

Se exponen al frontend a través del API Gateway (`/api/v1/...`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/users` | Lista el personal (sin contraseñas) |
| `GET` | `/users/offices` | Lista las oficinas |
| `POST` | `/users/login` | Inicia sesión y devuelve el JWT |
| `POST` | `/users` | Crea un usuario |
| `POST` | `/users/register` | Registro de usuario |
| `PATCH` | `/users/:id/status` | Activa o desactiva una cuenta |
| `POST` | `/users/seed` | Crea la oficina y las cuentas demo si no existen |

## Variables de entorno

Copia `.env.example` a `.env`. Las credenciales **nunca** se suben al repositorio; en producción se configuran como variables en la plataforma de despliegue.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3001) |
| `DATABASE_URL` | Conexión a PostgreSQL (`realtyhub_user_db`) |
| `RABBITMQ_URL` | Conexión a RabbitMQ |
| `JWT_SECRET` | Clave con la que se firman los JWT (la misma del API Gateway) |

## Instalación y ejecución

```bash
npm install
cp .env.example .env        # y completa los valores
npx prisma generate
npx prisma db push          # crea las tablas (o usa database/schema.sql)
npm run start:dev           # http://localhost:3001
```

Compilación de producción: `npm run build && npm run start:prod`.

### Con Docker

```bash
docker build -t user-service .
docker run --env-file .env -p 3001:3001 user-service
```

El contenedor sincroniza el esquema (`prisma db push`) al arrancar.

## Base de datos

Base `realtyhub_user_db` (PostgreSQL). Tablas: `offices`, `users`.

| Archivo | Contenido |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (fuente de verdad) |
| `database/schema.sql` | Script SQL de creación de tablas |
| `database/seed.sql` | Datos de ejemplo coherentes con los demás servicios |

Restaurar desde cero:

```bash
createdb realtyhub_user_db
psql -d realtyhub_user_db -f database/schema.sql
psql -d realtyhub_user_db -f database/seed.sql
```

Respaldo y restauración de la base:

```bash
pg_dump -Fc -d realtyhub_user_db -f database/realtyhub_user_db.dump
pg_restore -d realtyhub_user_db --clean --if-exists database/realtyhub_user_db.dump
```

## Pruebas

```bash
npm run test
```
