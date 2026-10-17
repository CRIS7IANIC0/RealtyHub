# Viewing Service

Agenda visitas que quedan en un pool; cualquier agente puede tomarlas. Evita dobles reservas de una propiedad en el mismo horario y notifica cada cambio.

**Responsabilidad en la arquitectura:** Agenda de visitas a propiedades (pool de visitas tipo Uber).

Parte de **RealtyHub**, plataforma inmobiliaria basada en microservicios. Se comunica con el resto por API REST y por mensajería (RabbitMQ).

## Tecnologías

NestJS · TypeScript · Prisma ORM · PostgreSQL · RabbitMQ · Docker

## Reglas de negocio

- property_id, lead_id y scheduled_at son obligatorios.
- No se permiten dos visitas a la misma propiedad en el mismo horario.
- Tomar una visita exige agent_id.

## Endpoints principales

Se exponen al frontend a través del API Gateway (`/api/v1/...`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/viewings` | Lista ordenada por fecha |
| `POST` | `/viewings` | Agenda una visita (queda Pendiente) |
| `PATCH` | `/viewings/:id/take` | Un agente toma la visita (pasa a Asignada) |

## Eventos (RabbitMQ)

| Evento | Efecto |
|---|---|
| `viewing.created (emite)` | Hacia notification-service |
| `viewing.taken (emite)` | Hacia notification-service |

## Variables de entorno

Copia `.env.example` a `.env`. Las credenciales **nunca** se suben al repositorio; en producción se configuran como variables en la plataforma de despliegue.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3005) |
| `DATABASE_URL` | Conexión a PostgreSQL (`realtyhub_viewing_db`) |
| `RABBITMQ_URL` | Conexión a RabbitMQ |

## Instalación y ejecución

```bash
npm install
cp .env.example .env        # y completa los valores
npx prisma generate
npx prisma db push          # crea las tablas (o usa database/schema.sql)
npm run start:dev           # http://localhost:3005
```

Compilación de producción: `npm run build && npm run start:prod`.

### Con Docker

```bash
docker build -t viewing-service .
docker run --env-file .env -p 3005:3005 viewing-service
```

El contenedor sincroniza el esquema (`prisma db push`) al arrancar.

## Base de datos

Base `realtyhub_viewing_db` (PostgreSQL). Tablas: `viewings`.

| Archivo | Contenido |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (fuente de verdad) |
| `database/schema.sql` | Script SQL de creación de tablas |
| `database/seed.sql` | Datos de ejemplo coherentes con los demás servicios |

Restaurar desde cero:

```bash
createdb realtyhub_viewing_db
psql -d realtyhub_viewing_db -f database/schema.sql
psql -d realtyhub_viewing_db -f database/seed.sql
```

Respaldo y restauración de la base:

```bash
pg_dump -Fc -d realtyhub_viewing_db -f database/realtyhub_viewing_db.dump
pg_restore -d realtyhub_viewing_db --clean --if-exists database/realtyhub_viewing_db.dump
```

## Pruebas

```bash
npm run test
```
