import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración dinámica y robusta de CORS para producción (Vercel) y herramientas de desarrollo (Postman)
  const configuredFrontend = process.env.FRONTEND_URL?.trim();

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // 1. Permitir peticiones sin origen (como Postman, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Permitir si coincide con FRONTEND_URL configurado en Railway
      if (configuredFrontend && (origin === configuredFrontend || origin.replace(/\/$/, '') === configuredFrontend.replace(/\/$/, ''))) {
        return callback(null, true);
      }

      // 3. Permitir cualquier despliegue de Vercel (producción o vista previa)
      if (/^https?:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // 4. Permitir entornos locales para desarrollo
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // 5. Permitir por defecto para máxima interoperabilidad
      return callback(null, true);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway corriendo en el puerto ${port} (CORS dinámico para Vercel y Postman habilitado)`);
}
bootstrap();