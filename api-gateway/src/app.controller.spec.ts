import { HttpException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppController } from './app.controller';

/** Token HS256 firmado igual que lo hace el user-service. */
function token(payload: Record<string, unknown>, secret = 'secreto-de-prueba') {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 });
  const sig = crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

/** Pruebas unitarias del api-gateway (autorización; sin llamar a otros servicios). */
describe('AppController (unit) — api-gateway', () => {
  let controller: AppController;

  beforeEach(() => {
    process.env.JWT_SECRET = 'secreto-de-prueba';
    jest.restoreAllMocks();
    controller = new AppController();
  });

  it('desactivar una cuenta exige autenticación y rol ADMIN', async () => {
    await expect(controller.setUserStatus('u9', { active: false })).rejects.toMatchObject({ status: 401 });

    const agente = token({ sub: 'u3', role: 'AGENTE' });
    await expect(controller.setUserStatus('u9', { active: false }, `Bearer ${agente}`)).rejects.toMatchObject({ status: 403 });
  });

  it('un ADMIN no puede desactivar su propia cuenta y un token con firma inválida se rechaza', async () => {
    const admin = token({ sub: 'u1', role: 'ADMIN' });
    await expect(controller.setUserStatus('u1', { active: false }, `Bearer ${admin}`)).rejects.toMatchObject({ status: 400 });

    const falso = token({ sub: 'u1', role: 'ADMIN' }, 'otra-clave');
    const attempt = controller.setUserStatus('u9', { active: false }, `Bearer ${falso}`);
    await expect(attempt).rejects.toBeInstanceOf(HttpException);
    await expect(attempt).rejects.toMatchObject({ status: 401 });
  });
});
