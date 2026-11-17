# Pruebas de RealtyHub

## 1. Pruebas unitarias y de integración (Jest)

Cada microservicio y el gateway tienen **2 pruebas unitarias** (`src/app.controller.spec.ts`)
y **1 de integración** (`test/app.e2e-spec.ts`). Prisma y RabbitMQ van simulados, así que no
necesitan base de datos ni broker.

```bash
cd <servicio>          # user-service, property-service, lead-service, viewing-service,
                       # contract-service, commission-service, notification-service,
                       # analytics-service, api-gateway
npm install
npx prisma generate    # (no aplica al api-gateway)
npm test               # 2 unitarias
npm run test:e2e       # 1 de integración (capa HTTP real de Nest + controlador)
```

| Servicio | Unitarias | Integración |
|---|---|---|
| user-service | login emite JWT sin exponer la contraseña · registro duplicado → 409 | `POST /users/login`: 201 / 401 / 403 |
| property-service | infiere operación, tipo y ciudad · rechaza precio/estado inválidos | filtros de `GET /properties`, 404 y 400 |
| lead-service | lead nuevo queda "Nuevo" · orden por fecha | crear y listar leads |
| viewing-service | no permite doble visita en el mismo horario · "tomar visita" asigna agente | agendar, duplicado 400, tomar |
| contract-service | Firmado guarda `signed_at` y emite a 4 colas · estado inválido y Pendiente | `PATCH status` dispara el fanout solo en Pendiente→Firmado |
| commission-service | comisión del 5 % · idempotencia | evento → comisión → `GET` → `PATCH /pay` |
| notification-service | notificación con nombres reales · degradación si fallan los vecinos | listar, `read-all` vs `/:id/read` |
| analytics-service | métrica de ingreso · totales y fallback a ceros | evento → `GET /analytics` |
| api-gateway | exige JWT y rol ADMIN · no autodesactivación y firma inválida | reenvío a property-service y fallback `[]` |

## 2. Métricas (Prometheus)

Todos los servicios exponen `GET /metrics` (`src/metrics.ts`, librería `prom-client`):
métricas del proceso (CPU, memoria, event loop) y `http_requests_total` /
`http_request_duration_seconds` por servicio, método, ruta y estado.

Puertos: gateway 3000 · user 3001 · property 3003 · lead 3004 · viewing 3005 ·
contract 3006 · commission 3007 · notification 3009 · analytics 3010.

## 3. Prometheus + Grafana

Con Docker:

```bash
docker compose -f monitoring/docker-compose.monitoring.yml up -d
```

- Prometheus: http://localhost:9090 · Grafana: http://localhost:3030 (`admin` / `admin`)
- El dashboard **RealtyHub — Microservicios** se carga solo (servicios arriba, peticiones/s,
  latencia p95, errores 4xx/5xx, CPU, memoria, event loop y rutas más lentas).

Sin Docker: ejecutar `prometheus.exe --config.file=monitoring/prometheus/prometheus.local.yml`
y `grafana-server`, y en `monitoring/grafana/provisioning/datasources/prometheus.yml` cambiar la URL
a `http://localhost:9090`.

## 4. Prueba de carga (JMeter)

`jmeter/realtyhub-load-test.jmx` tiene 3 grupos de hilos:

1. **Visitantes — páginas del sitio:** `/`, `/properties`, `/login`, `/terms`, `/privacy`.
2. **Visitantes — API pública:** ver propiedades, detalle, crear lead y agendar visita.
3. **Equipo — login y panel:** `POST /login` y consultas a leads, visitas, contratos,
   comisiones, notificaciones, analíticas y usuarios.

Cada petición valida código 2xx y tiempo de respuesta < 3 s.

```powershell
.\jmeter\run-jmeter.ps1 -Users 50 -Ramp 30 -Loops 10
```

Deja el informe HTML en `jmeter/results/<fecha>/informe/index.html`. Mientras corre,
Grafana muestra la carga sobre cada microservicio.

## 5. Cómo se ejecutó localmente (sin Docker)

Entorno: frontend en producción (`next build` + `next start -p 3002`), **api-gateway real** (:3000)
apuntando a un backend simulado (`jmeter/stub-backend.js`, :3100) porque este equipo no tiene
Postgres/RabbitMQ/Docker, y el exportador (`monitoring/exporter`, :9111) que lee los resultados de
JMeter en vivo. Prometheus (:9090) y Grafana (:3030, `admin`/`admin`) corren como binarios.

```bash
node jmeter/stub-backend.js
PORT=3000 JWT_SECRET=secreto-de-prueba USER_SERVICE_URL=http://localhost:3100 ... node api-gateway/dist/main
(cd frontend && npx next start -p 3002)
(cd monitoring/exporter && npm install && node exporter.js)
prometheus --config.file=monitoring/prometheus/prometheus.local.yml
grafana-server      # dashboards en monitoring/grafana/dashboards
.\jmeter\run-jmeter.ps1 -Users 40 -Ramp 40 -Loops 8 -Writes
```

> Con este montaje Prometheus ve **solo el api-gateway** (los otros 8 servicios aparecen caídos
> porque no hay bases de datos). Con Docker/Postgres/RabbitMQ disponibles se ven los 9.
> `-Writes` solo debe usarse en entornos de prueba (crea leads y visitas).

## 6. Resultado de la prueba de carga (40 usuarios por grupo, 3 grupos)

| | |
|---|---|
| Muestras | 5.760 |
| Errores | **0 %** |
| Rendimiento | 50,2 peticiones/s |
| Tiempo medio | 22,4 ms |
| p95 / p99 / máx. | 43 / 49 / 89 ms |

Páginas del sitio (`/`, `/login`, `/terms`, `/privacy`): media 2–3 ms, p95 ≤ 5 ms.
`/properties` (renderizado en servidor): media 35 ms, p95 53 ms.
Llamadas a la API: media ~28 ms, p95 ~44 ms (incluye ~5–35 ms de latencia simulada del backend de prueba).
