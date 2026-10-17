# Commission Service

Al firmarse un contrato calcula la comisión y la reparte entre agente, oficina y central según el tipo de operación y el acuerdo comercial vigente; el administrador puede fijar una comisión individual por agente.

**Responsabilidad en la arquitectura:** Cálculo automático de la comisión de cada operación cerrada y su reparto.

Parte de **RealtyHub**, plataforma inmobiliaria basada en microservicios. Se comunica con el resto por API REST y por mensajería (RabbitMQ).

## Tecnologías

NestJS · TypeScript · Prisma ORM · PostgreSQL · RabbitMQ · Docker

## Reglas de negocio

- Venta: 3 % del precio · Alquiler: 100 % de un canon (valores iniciales editables).
- Reparto por defecto: Venta 50/30/20 y Alquiler 40/35/25 (agente/oficina/central).
- Los porcentajes del reparto deben sumar 100 %; la central absorbe el redondeo.
- La comisión individual del agente prevalece sobre el acuerdo general.
- Sin oficina asignada, la porción de oficina pasa a la central.
- Un cambio de acuerdo crea una versión nueva sin alterar las comisiones ya generadas.

## Endpoints principales

Se exponen al frontend a través del API Gateway (`/api/v1/...`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/commissions` | Lista de comisiones |
| `PATCH` | `/commissions/:id/pay` | Marca una comisión como pagada |
| `GET` | `/commissions/agreements` | Acuerdos comerciales (vigentes e históricos) |
| `POST` | `/commissions/agreements` | Crea una nueva versión del acuerdo |
| `GET` | `/commissions/agent-rules` | Comisiones individuales por agente |
| `PUT` | `/commissions/agent-rules` | Asigna o actualiza la comisión de un agente |
| `DELETE` | `/commissions/agent-rules/:id` | Devuelve al agente al acuerdo general |

## Eventos (RabbitMQ)

| Evento | Efecto |
|---|---|
| `contract.signed` | Calcula y registra la comisión (idempotente por contrato) |
| `contract.reverted` | Anula la comisión si aún está pendiente |
| `commission.paid (emite)` | Hacia notification-service |

## Variables de entorno

Copia `.env.example` a `.env`. Las credenciales **nunca** se suben al repositorio; en producción se configuran como variables en la plataforma de despliegue.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3007) |
| `DATABASE_URL` | Conexión a PostgreSQL (`realtyhub_commission_db`) |
| `RABBITMQ_URL` | Conexión a RabbitMQ |
| `USER_SERVICE_URL` | URL interna de user-service |

## Instalación y ejecución

```bash
npm install
cp .env.example .env        # y completa los valores
npx prisma generate
npx prisma db push          # crea las tablas (o usa database/schema.sql)
npm run start:dev           # http://localhost:3007
```

Compilación de producción: `npm run build && npm run start:prod`.

### Con Docker

```bash
docker build -t commission-service .
docker run --env-file .env -p 3007:3007 commission-service
```

El contenedor sincroniza el esquema (`prisma db push`) al arrancar.

## Base de datos

Base `realtyhub_commission_db` (PostgreSQL). Tablas: `commissions`, `commission_agreements`, `agent_commission_rules`.

| Archivo | Contenido |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (fuente de verdad) |
| `database/schema.sql` | Script SQL de creación de tablas |
| `database/seed.sql` | Datos de ejemplo coherentes con los demás servicios |

Restaurar desde cero:

```bash
createdb realtyhub_commission_db
psql -d realtyhub_commission_db -f database/schema.sql
psql -d realtyhub_commission_db -f database/seed.sql
```

Respaldo y restauración de la base:

```bash
pg_dump -Fc -d realtyhub_commission_db -f database/realtyhub_commission_db.dump
pg_restore -d realtyhub_commission_db --clean --if-exists database/realtyhub_commission_db.dump
```

## Pruebas

```bash
npm run test
```
