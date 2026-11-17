import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import * as client from 'prom-client';

/**
 * Observabilidad (Prometheus): expone GET /metrics con
 *  - métricas por defecto del proceso (CPU, memoria, event loop, GC),
 *  - http_requests_total{service,method,route,status}
 *  - http_request_duration_seconds{service,method,route,status} (histograma).
 * `route` usa la ruta declarada (/users/:id/status), no la URL real, para no
 * generar series infinitas.
 */
export function setupMetrics(app: INestApplication, service: string) {
  const register = new client.Registry();
  register.setDefaultLabels({ service });
  client.collectDefaultMetrics({ register });

  const total = new client.Counter({
    name: 'http_requests_total',
    help: 'Total de peticiones HTTP',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [register],
  });
  const duration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de las peticiones HTTP en segundos',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/metrics') return next();
    const end = duration.startTimer();
    res.on('finish', () => {
      const route = req.route?.path ? `${req.baseUrl ?? ''}${req.route.path}` : 'no_encontrada';
      const labels = { method: req.method, route, status: String(res.statusCode) };
      total.inc(labels);
      end(labels);
    });
    next();
  });

  app.getHttpAdapter().get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}
