# Property Service

CRUD de inmuebles con filtros (estado, operación, tipo, ciudad). Actualiza su estado a Vendida/Alquilada al recibir un contrato firmado.

**Responsabilidad en la arquitectura:** Catálogo de propiedades en venta y alquiler y su disponibilidad.

Parte de **RealtyHub**, plataforma inmobiliaria basada en microservicios. Se comunica con el resto por API REST y por mensajería (RabbitMQ).

## Tecnologías

NestJS · TypeScript · Prisma ORM · PostgreSQL · RabbitMQ · Docker

## Reglas de negocio

- Título, dirección y precio (> 0) son obligatorios.
- Estado, operación y tipo se validan contra listas cerradas.
- Al firmarse un contrato la propiedad cambia sola de estado.

## Endpoints principales

Se exponen al frontend a través del API Gateway (`/api/v1/...`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/properties` | Lista con filtros ?status=&operation=&type=&city= |
| `GET` | `/properties/:id` | Detalle |
| `POST` | `/properties` | Crea una propiedad |
| `PATCH` | `/properties/:id` | Edita una propiedad |
| `PATCH` | `/properties/:id/status` | Cambia el estado (Disponible, Reservada, Vendida, Alquilada) |

## Eventos (RabbitMQ)

| Evento | Efecto |
|---|---|
| `contract.signed` | Marca la propiedad como Vendida o Alquilada |

## Variables de entorno

Copia `.env.example` a `.env`. Las credenciales **nunca** se suben al repositorio; en producción se configuran como variables en la plataforma de despliegue.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3003) |
| `DATABASE_URL` | Conexión a PostgreSQL (`realtyhub_property_db`) |
| `RABBITMQ_URL` | Conexión a RabbitMQ |

## Instalación y ejecución

```bash
npm install
cp .env.example .env        # y completa los valores
npx prisma generate
npx prisma db push          # crea las tablas (o usa database/schema.sql)
npm run start:dev           # http://localhost:3003
```

Compilación de producción: `npm run build && npm run start:prod`.

### Con Docker

```bash
docker build -t property-service .
docker run --env-file .env -p 3003:3003 property-service
```

El contenedor sincroniza el esquema (`prisma db push`) al arrancar.

## Base de datos

Base `realtyhub_property_db` (PostgreSQL). Tablas: `properties`.

| Archivo | Contenido |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (fuente de verdad) |
| `database/schema.sql` | Script SQL de creación de tablas |
| `database/seed.sql` | Datos de ejemplo coherentes con los demás servicios |

Restaurar desde cero:

```bash
createdb realtyhub_property_db
psql -d realtyhub_property_db -f database/schema.sql
psql -d realtyhub_property_db -f database/seed.sql
```

Respaldo y restauración de la base:

```bash
pg_dump -Fc -d realtyhub_property_db -f database/realtyhub_property_db.dump
pg_restore -d realtyhub_property_db --clean --if-exists database/realtyhub_property_db.dump
```

## Pruebas

```bash
npm run test
```
