# Lead Service

Registra los leads que llegan al solicitar una visita y los asigna automáticamente al agente activo con menos leads (reparto equitativo). Avisa al agente por mensajería.

**Responsabilidad en la arquitectura:** Clientes potenciales (leads) y su asignación a agentes.

Parte de **RealtyHub**, plataforma inmobiliaria basada en microservicios. Se comunica con el resto por API REST y por mensajería (RabbitMQ).

## Tecnologías

NestJS · TypeScript · Prisma ORM · PostgreSQL · RabbitMQ · Docker

## Reglas de negocio

- name, email y property_id son obligatorios.
- Asignación equitativa entre agentes activos; sin agentes se avisa a gerencia.
- Un fallo de RabbitMQ nunca impide registrar el lead.

## Endpoints principales

Se exponen al frontend a través del API Gateway (`/api/v1/...`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/leads` | Lista de leads |
| `POST` | `/leads` | Registra un lead y lo asigna a un agente |

## Eventos (RabbitMQ)

| Evento | Efecto |
|---|---|
| `lead.created (emite)` | Hacia notification-service: alerta de nuevo lead asignado |

## Variables de entorno

Copia `.env.example` a `.env`. Las credenciales **nunca** se suben al repositorio; en producción se configuran como variables en la plataforma de despliegue.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3004) |
| `DATABASE_URL` | Conexión a PostgreSQL (`realtyhub_lead_db`) |
| `RABBITMQ_URL` | Conexión a RabbitMQ |
| `USER_SERVICE_URL` | URL interna de user-service |

## Instalación y ejecución

```bash
npm install
cp .env.example .env        # y completa los valores
npx prisma generate
npx prisma db push          # crea las tablas (o usa database/schema.sql)
npm run start:dev           # http://localhost:3004
```

Compilación de producción: `npm run build && npm run start:prod`.

### Con Docker

```bash
docker build -t lead-service .
docker run --env-file .env -p 3004:3004 lead-service
```

El contenedor sincroniza el esquema (`prisma db push`) al arrancar.

## Base de datos

Base `realtyhub_lead_db` (PostgreSQL). Tablas: `leads`.

| Archivo | Contenido |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (fuente de verdad) |
| `database/schema.sql` | Script SQL de creación de tablas |
| `database/seed.sql` | Datos de ejemplo coherentes con los demás servicios |

Restaurar desde cero:

```bash
createdb realtyhub_lead_db
psql -d realtyhub_lead_db -f database/schema.sql
psql -d realtyhub_lead_db -f database/seed.sql
```

Respaldo y restauración de la base:

```bash
pg_dump -Fc -d realtyhub_lead_db -f database/realtyhub_lead_db.dump
pg_restore -d realtyhub_lead_db --clean --if-exists database/realtyhub_lead_db.dump
```

## Pruebas

```bash
npm run test
```
