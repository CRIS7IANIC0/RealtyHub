# Analytics Service

Calcula en vivo los indicadores consultando contratos, leads, propiedades, usuarios y comisiones. Conserva además cada cierre recibido por RabbitMQ como respaldo de ingresos.

**Responsabilidad en la arquitectura:** KPIs comerciales: tiempo de cierre, conversión de leads y rendimiento de agentes y oficinas.

Parte de **RealtyHub**, plataforma inmobiliaria basada en microservicios. Se comunica con el resto por API REST y por mensajería (RabbitMQ).

## Tecnologías

NestJS · TypeScript · Prisma ORM · PostgreSQL · RabbitMQ · Docker

## Reglas de negocio

- Tiempo de cierre = del ingreso del lead a la firma, agrupado por tipo de propiedad.
- Conversión = leads con contrato firmado / leads totales, por canal de origen.
- Agentes y oficinas se ordenan por volumen cerrado.
- Si contract-service no responde se usa el respaldo de la tabla metrics (datos parciales).

## Endpoints principales

Se exponen al frontend a través del API Gateway (`/api/v1/...`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/analytics` | Panel completo de KPIs |

## Eventos (RabbitMQ)

| Evento | Efecto |
|---|---|
| `contract.signed` | Registra el cierre en la tabla metrics |

## Variables de entorno

Copia `.env.example` a `.env`. Las credenciales **nunca** se suben al repositorio; en producción se configuran como variables en la plataforma de despliegue.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3010) |
| `DATABASE_URL` | Conexión a PostgreSQL (`realtyhub_analytics_db`) |
| `RABBITMQ_URL` | Conexión a RabbitMQ |
| `CONTRACT_SERVICE_URL` | URL interna de contract-service |
| `LEAD_SERVICE_URL` | URL interna de lead-service |
| `PROPERTY_SERVICE_URL` | URL interna de property-service |
| `USER_SERVICE_URL` | URL interna de user-service |
| `COMMISSION_SERVICE_URL` | URL interna de commission-service |

## Instalación y ejecución

```bash
npm install
cp .env.example .env        # y completa los valores
npx prisma generate
npx prisma db push          # crea las tablas (o usa database/schema.sql)
npm run start:dev           # http://localhost:3010
```

Compilación de producción: `npm run build && npm run start:prod`.

### Con Docker

```bash
docker build -t analytics-service .
docker run --env-file .env -p 3010:3010 analytics-service
```

El contenedor sincroniza el esquema (`prisma db push`) al arrancar.

## Base de datos

Base `realtyhub_analytics_db` (PostgreSQL). Tablas: `metrics`, `conversion_by_agent`, `avg_closing_time`, `leads_by_source`.

| Archivo | Contenido |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (fuente de verdad) |
| `database/schema.sql` | Script SQL de creación de tablas |
| `database/seed.sql` | Datos de ejemplo coherentes con los demás servicios |

Restaurar desde cero:

```bash
createdb realtyhub_analytics_db
psql -d realtyhub_analytics_db -f database/schema.sql
psql -d realtyhub_analytics_db -f database/seed.sql
```

Respaldo y restauración de la base:

```bash
pg_dump -Fc -d realtyhub_analytics_db -f database/realtyhub_analytics_db.dump
pg_restore -d realtyhub_analytics_db --clean --if-exists database/realtyhub_analytics_db.dump
```

## Pruebas

```bash
npm run test
```
