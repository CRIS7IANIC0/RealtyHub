# Contract Service

Crea contratos, gestiona su estado y la firma electrónica de las partes (enlace por token, huella SHA-256 y sello HMAC, Ley 527 de 1999). Genera el PDF con la constancia de firma y un QR de verificación. Al completarse las firmas emite `contract.signed` a todos los servicios.

**Responsabilidad en la arquitectura:** Contratos de venta y alquiler, firma digital y generación del PDF.

Parte de **RealtyHub**, plataforma inmobiliaria basada en microservicios. Se comunica con el resto por API REST y por mensajería (RabbitMQ).

## Tecnologías

NestJS · TypeScript · Prisma ORM · PostgreSQL · RabbitMQ · Docker

## Reglas de negocio

- El contrato pasa a Firmado sólo cuando firman las dos partes.
- Cada parte firma una única vez; la firma exige nombre, documento, trazo y aceptación.
- Si cambian los términos del contrato las firmas dejan de verificar.
- Volver a Pendiente borra las firmas y anula la comisión pendiente.

## Endpoints principales

Se exponen al frontend a través del API Gateway (`/api/v1/...`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/contracts` | Lista de contratos |
| `POST` | `/contracts` | Crea un contrato |
| `PATCH` | `/contracts/:id/status` | Cambia el estado (volver a Pendiente anula las firmas) |
| `GET` | `/contracts/:id/pdf` | Descarga el PDF |
| `GET` | `/contracts/:id/signatures` | Estado de firmas y enlaces de firma |
| `GET` | `/contracts/:id/verify` | Verifica la integridad del contrato y de cada firma |
| `GET` | `/contracts/sign/:token` | Datos del contrato para el firmante (público por token) |
| `POST` | `/contracts/sign/:token` | Registra la firma de una parte (público por token) |

## Eventos (RabbitMQ)

| Evento | Efecto |
|---|---|
| `contract.signed (emite)` | A comisiones, notificaciones, analítica y propiedades |
| `contract.created / contract.signature_added / contract.reverted (emite)` | A notificaciones (y reverted también a comisiones) |

## Variables de entorno

Copia `.env.example` a `.env`. Las credenciales **nunca** se suben al repositorio; en producción se configuran como variables en la plataforma de despliegue.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3006) |
| `DATABASE_URL` | Conexión a PostgreSQL (`realtyhub_contract_db`) |
| `RABBITMQ_URL` | Conexión a RabbitMQ |
| `FRONTEND_URL` | Dirección pública del frontend; el QR del PDF apunta a /verify/<id> |
| `SIGNATURE_SECRET` | Clave del sello HMAC de las firmas (opcional; por defecto usa JWT_SECRET) |
| `PROPERTY_SERVICE_URL` | URL interna de property-service |
| `LEAD_SERVICE_URL` | URL interna de lead-service |
| `USER_SERVICE_URL` | URL interna de user-service |

## Instalación y ejecución

```bash
npm install
cp .env.example .env        # y completa los valores
npx prisma generate
npx prisma db push          # crea las tablas (o usa database/schema.sql)
npm run start:dev           # http://localhost:3006
```

Compilación de producción: `npm run build && npm run start:prod`.

### Con Docker

```bash
docker build -t contract-service .
docker run --env-file .env -p 3006:3006 contract-service
```

El contenedor sincroniza el esquema (`prisma db push`) al arrancar.

## Base de datos

Base `realtyhub_contract_db` (PostgreSQL). Tablas: `contracts`, `documents`, `contract_signatures`.

| Archivo | Contenido |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (fuente de verdad) |
| `database/schema.sql` | Script SQL de creación de tablas |
| `database/seed.sql` | Datos de ejemplo coherentes con los demás servicios |

Restaurar desde cero:

```bash
createdb realtyhub_contract_db
psql -d realtyhub_contract_db -f database/schema.sql
psql -d realtyhub_contract_db -f database/seed.sql
```

Respaldo y restauración de la base:

```bash
pg_dump -Fc -d realtyhub_contract_db -f database/realtyhub_contract_db.dump
pg_restore -d realtyhub_contract_db --clean --if-exists database/realtyhub_contract_db.dump
```

## Pruebas

```bash
npm run test
```
