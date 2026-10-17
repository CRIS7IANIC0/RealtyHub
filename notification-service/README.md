# Notification Service

Genera notificaciones por destinatario (agente, cliente y gerencia). Programa recordatorios de visitas a 24 h y 1 h. Si hay SMTP configurado envía además correos al cliente y avisos operativos.

**Responsabilidad en la arquitectura:** Alertas de leads asignados, recordatorios de visitas y cambios de estado de contratos.

Parte de **RealtyHub**, plataforma inmobiliaria basada en microservicios. Se comunica con el resto por API REST y por mensajería (RabbitMQ).

## Tecnologías

NestJS · TypeScript · Prisma ORM · PostgreSQL · RabbitMQ · Docker

## Reglas de negocio

- Cada persona sólo ve sus notificaciones y los avisos generales.
- Los recordatorios se envían una sola vez por visita y ventana (clave única).
- Un fallo del correo no impide guardar la notificación.

## Endpoints principales

Se exponen al frontend a través del API Gateway (`/api/v1/...`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/notifications` | Lista ?user_id=&role=&unread=true |
| `GET` | `/notifications/unread-count` | Contador de no leídas del usuario |
| `PATCH` | `/notifications/read-all` | Marca como leídas las del usuario |
| `PATCH` | `/notifications/:id/read` | Marca una como leída |

## Eventos (RabbitMQ)

| Evento | Efecto |
|---|---|
| `lead.created` | Alerta al agente asignado (o a gerencia si no hay agentes) |
| `viewing.created / viewing.taken` | Avisos al pool, al agente y al cliente |
| `contract.created / contract.signature_added / contract.signed / contract.reverted` | Avisos a agente, cliente y gerencia |
| `commission.paid` | Aviso al agente beneficiario |

## Variables de entorno

Copia `.env.example` a `.env`. Las credenciales **nunca** se suben al repositorio; en producción se configuran como variables en la plataforma de despliegue.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP (por defecto 3009) |
| `DATABASE_URL` | Conexión a PostgreSQL (`realtyhub_notification_db`) |
| `RABBITMQ_URL` | Conexión a RabbitMQ |
| `SMTP_HOST` | Servidor SMTP (opcional; sin él no se envían correos) |
| `SMTP_PORT` | Puerto SMTP (587 por defecto) |
| `SMTP_SECURE` | "true" para TLS directo |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASS` | Contraseña SMTP |
| `SMTP_FROM` | Remitente, p. ej. RealtyHub <no-reply@dominio.com> |
| `USER_SERVICE_URL` | URL interna de user-service |
| `LEAD_SERVICE_URL` | URL interna de lead-service |
| `PROPERTY_SERVICE_URL` | URL interna de property-service |
| `VIEWING_SERVICE_URL` | URL interna de viewing-service |

## Instalación y ejecución

```bash
npm install
cp .env.example .env        # y completa los valores
npx prisma generate
npx prisma db push          # crea las tablas (o usa database/schema.sql)
npm run start:dev           # http://localhost:3009
```

Compilación de producción: `npm run build && npm run start:prod`.

### Con Docker

```bash
docker build -t notification-service .
docker run --env-file .env -p 3009:3009 notification-service
```

El contenedor sincroniza el esquema (`prisma db push`) al arrancar.

## Base de datos

Base `realtyhub_notification_db` (PostgreSQL). Tablas: `notifications`.

| Archivo | Contenido |
|---|---|
| `prisma/schema.prisma` | Modelo de datos (fuente de verdad) |
| `database/schema.sql` | Script SQL de creación de tablas |
| `database/seed.sql` | Datos de ejemplo coherentes con los demás servicios |

Restaurar desde cero:

```bash
createdb realtyhub_notification_db
psql -d realtyhub_notification_db -f database/schema.sql
psql -d realtyhub_notification_db -f database/seed.sql
```

Respaldo y restauración de la base:

```bash
pg_dump -Fc -d realtyhub_notification_db -f database/realtyhub_notification_db.dump
pg_restore -d realtyhub_notification_db --clean --if-exists database/realtyhub_notification_db.dump
```

## Pruebas

```bash
npm run test
```
