# API Gateway

Único punto de entrada de RealtyHub (`/api/v1/...`). Reenvía cada ruta al microservicio correspondiente, valida el JWT y aplica los permisos por rol (ADMIN, GERENTE, AGENTE). No tiene base de datos propia.

## Tecnologías
NestJS · TypeScript

## Permisos destacados
- Propiedades (crear/editar/estado) y estado de contratos: ADMIN y GERENTE.
- Comisión individual por agente: sólo ADMIN. Acuerdos generales y pagos: ADMIN y GERENTE.
- Un AGENTE sólo ve y crea contratos de las visitas que tomó.
- `GET /contracts/sign/:token`, `POST /contracts/sign/:token` y `GET /contracts/:id/verify` son públicos (firma electrónica y verificación).
- `GET /health` comprueba que el gateway alcanza a cada microservicio.

## Variables de entorno
Ver `.env.example`: `PORT`, `JWT_SECRET` y la URL interna de cada microservicio.

## Ejecución
```bash
npm install
cp .env.example .env
npm run start:dev   # http://localhost:3000/api/v1
```
