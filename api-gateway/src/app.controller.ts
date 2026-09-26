import { Controller, Get, Post, Patch, Body, Param, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { verifyJwt } from './jwt.util';

// ─── Helper: garantiza que la URL de un microservicio siempre tenga protocolo ───
// Railway a veces omite "https://" en las variables de entorno (solo el hostname).
// La red privada de Railway (*.railway.internal) solo habla HTTP plano.
function withProtocol(url: string | undefined, fallback: string): string {
  const clean = url?.trim().replace(/\/+$/, '');
  if (!clean) return fallback;
  if (clean.startsWith('http')) return clean;
  return clean.includes('.railway.internal') ? `http://${clean}` : `https://${clean}`;
}

// ─── URLs de microservicios (configurables via variables de entorno en Railway) ───
const USER_SVC       = withProtocol(process.env.USER_SERVICE_URL,       'http://localhost:3001');
const PROPERTY_SVC   = withProtocol(process.env.PROPERTY_SERVICE_URL,   'http://localhost:3003');
const LEAD_SVC       = withProtocol(process.env.LEAD_SERVICE_URL,       'http://localhost:3004');
const VIEWING_SVC    = withProtocol(process.env.VIEWING_SERVICE_URL,    'http://localhost:3005');
const CONTRACT_SVC   = withProtocol(process.env.CONTRACT_SERVICE_URL,   'http://localhost:3006');
const COMMISSION_SVC = withProtocol(process.env.COMMISSION_SERVICE_URL, 'http://localhost:3007');
const NOTIFICATION_SVC = withProtocol(process.env.NOTIFICATION_SERVICE_URL, 'http://localhost:3009');
const ANALYTICS_SVC  = withProtocol(process.env.ANALYTICS_SERVICE_URL,  'http://localhost:3010');

@Controller()
export class AppController {

  // --- DIAGNÓSTICO: verifica que el gateway alcance a cada microservicio ---
  @Get('health')
  async health() {
    const services: Record<string, string> = {
      user: `${USER_SVC}/users`,
      property: `${PROPERTY_SVC}/properties`,
      lead: `${LEAD_SVC}/leads`,
      viewing: `${VIEWING_SVC}/viewings`,
      contract: `${CONTRACT_SVC}/contracts`,
      commission: `${COMMISSION_SVC}/commissions`,
      notification: `${NOTIFICATION_SVC}/notifications`,
      analytics: `${ANALYTICS_SVC}/analytics`,
    };

    const entries = await Promise.all(
      Object.entries(services).map(async ([name, url]) => {
        const target = new URL(url).origin;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          return [name, { ok: res.ok, status: res.status, target }] as const;
        } catch (error) {
          const cause = (error as any)?.cause?.code ?? (error as Error).message;
          return [name, { ok: false, error: cause, target }] as const;
        }
      }),
    );

    const result = Object.fromEntries(entries);
    return { ok: entries.every(([, r]) => r.ok), services: result };
  }

  // --- RUTAS DE USUARIOS ---
  @Get('users')
  async getUsers() {
    const res = await fetch(`${USER_SVC}/users`);
    return res.json();
  }

  @Post('users')
  async createUser(@Body() body: any) {
    const res = await fetch(`${USER_SVC}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  @Post('login')
  async login(@Body() body: any) {
    try {
      const res = await fetch(`${USER_SVC}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new HttpException(
          data.message || 'Credenciales inválidas',
          res.status || HttpStatus.UNAUTHORIZED,
        );
      }
      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error de autenticación o de conexión con el servicio de usuarios',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('register')
  async register(@Body() body: any) {
    try {
      const res = await fetch(`${USER_SVC}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new HttpException(
          data.message || 'Error al registrar usuario',
          res.status || HttpStatus.BAD_REQUEST,
        );
      }
      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error de conexión con el servicio de usuarios para registro',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('users/seed')
  async seedUsers() {
    try {
      const res = await fetch(`${USER_SVC}/users/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      return data;
    } catch (error) {
      throw new HttpException(
        'Error al conectar con user-service para ejecutar seed',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // --- RUTAS DE AUTENTICACIÓN Y SEGURIDAD JWT ---
  @Post('auth/verify')
  async verifyAuthToken(@Body() body: { token?: string }, @Headers('authorization') authHeader?: string) {
    const token = body?.token || authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      throw new HttpException('Token no proporcionado en el cuerpo o encabezado Authorization', HttpStatus.BAD_REQUEST);
    }
    const payload = verifyJwt(token);
    return {
      valid: true,
      user: payload,
    };
  }

  @Get('auth/me')
  async getAuthMe(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      throw new HttpException('Encabezado Authorization: Bearer <token> requerido', HttpStatus.UNAUTHORIZED);
    }
    const payload = verifyJwt(token);
    return payload;
  }

  // --- RUTAS DE PROPIEDADES ---
  @Get('properties')
  async getProperties() {
    try {
      const res = await fetch(`${PROPERTY_SVC}/properties`);
      return res.json();
    } catch {
      return [];
    }
  }

  @Get('properties/:id')
  async getPropertyById(@Param('id') id: string) {
    try {
      const res = await fetch(`${PROPERTY_SVC}/properties/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new HttpException(
          data.message || 'Propiedad no encontrada',
          res.status || HttpStatus.NOT_FOUND,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener la propiedad del servicio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('properties')
  async createProperty(@Body() body: any) {
    const res = await fetch(`${PROPERTY_SVC}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  @Patch('properties/:id/status')
  async updatePropertyStatus(@Param('id') id: string, @Body() body: any) {
    const res = await fetch(`${PROPERTY_SVC}/properties/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // --- RUTAS DE LEADS ---
  @Get('leads')
  async getLeads() {
    try {
      const res = await fetch(`${LEAD_SVC}/leads`);
      return res.json();
    } catch {
      return [];
    }
  }

  @Post('leads')
  async createLead(@Body() body: any) {
    const res = await fetch(`${LEAD_SVC}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // --- RUTAS DE VISITAS (VIEWINGS) ---
  @Get('viewings')
  async getViewings() {
    try {
      const res = await fetch(`${VIEWING_SVC}/viewings`);
      return res.json();
    } catch {
      return [];
    }
  }

  @Post('viewings')
  async createViewing(@Body() body: any) {
    try {
      const res = await fetch(`${VIEWING_SVC}/viewings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new HttpException(
          data.message || 'Error al agendar la visita',
          res.status,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error de conexión con el servicio de visitas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('viewings/:id/take')
  async takeViewing(@Param('id') id: string, @Body() body: any) {
    try {
      const res = await fetch(`${VIEWING_SVC}/viewings/${id}/take`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new HttpException(
          data.message || 'Error al tomar la visita',
          res.status,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error de conexión con el servicio de visitas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- RUTAS DE CONTRATOS (CONTRACTS) ---
  @Get('contracts')
  async getContracts() {
    try {
      const res = await fetch(`${CONTRACT_SVC}/contracts`);
      return res.json();
    } catch {
      return [];
    }
  }

  @Post('contracts')
  async createContract(@Body() body: any) {
    try {
      const res = await fetch(`${CONTRACT_SVC}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new HttpException(
          data.message || 'Error al procesar el contrato',
          res.status,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error de conexión con el servicio de contratos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- RUTAS DE COMISIONES (COMMISSIONS) ---
  @Get('commissions')
  async getCommissions() {
    try {
      const res = await fetch(`${COMMISSION_SVC}/commissions`);
      return res.json();
    } catch {
      return [];
    }
  }

  // --- RUTAS DE NOTIFICACIONES (NOTIFICATIONS) ---
  @Get('notifications')
  async getNotifications() {
    try {
      const response = await fetch(`${NOTIFICATION_SVC}/notifications`);
      return response.json();
    } catch {
      return [];
    }
  }

  @Patch('notifications/:id/read')
  async markNotificationAsRead(@Param('id') id: string) {
    try {
      const response = await fetch(`${NOTIFICATION_SVC}/notifications/${id}/read`, {
        method: 'PATCH',
      });
      return response.json();
    } catch (error) {
      throw new HttpException(
        'Error al actualizar la notificación',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- RUTAS DE ANALÍTICAS (ANALYTICS) ---
  @Get('analytics')
  async getAnalytics() {
    try {
      const res = await fetch(`${ANALYTICS_SVC}/analytics`);
      return res.json();
    } catch {
      return { total_revenue: 0, total_sales: 0 };
    }
  }
}