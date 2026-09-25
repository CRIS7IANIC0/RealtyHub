import { Controller, Get, Post, Patch, Body, Param, HttpException, HttpStatus } from '@nestjs/common';

@Controller()
export class AppController {

  // --- RUTAS DE USUARIOS ---
  @Get('users')
  async getUsers() {
    const res = await fetch('http://localhost:3001/users');
    return res.json();
  }

  @Post('users')
  async createUser(@Body() body: any) {
    const res = await fetch('http://localhost:3001/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  @Post('login')
  async login(@Body() body: any) {
    try {
      const res = await fetch('http://localhost:3001/users/login', {
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

  // --- RUTAS DE PROPIEDADES ---
  @Get('properties')
  async getProperties() {
    try {
      const res = await fetch('http://localhost:3003/properties');
      return res.json();
    } catch {
      return [];
    }
  }

  @Get('properties/:id')
  async getPropertyById(@Param('id') id: string) {
    try {
      const res = await fetch(`http://localhost:3003/properties/${id}`);
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
    const res = await fetch('http://localhost:3003/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  @Patch('properties/:id/status')
  async updatePropertyStatus(@Param('id') id: string, @Body() body: any) {
    const res = await fetch(`http://localhost:3003/properties/${id}/status`, {
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
      const res = await fetch('http://localhost:3004/leads');
      return res.json();
    } catch {
      return [];
    }
  }

  @Post('leads')
  async createLead(@Body() body: any) {
    const res = await fetch('http://localhost:3004/leads', {
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
      const res = await fetch('http://localhost:3005/viewings');
      return res.json();
    } catch {
      return [];
    }
  }

  @Post('viewings')
  async createViewing(@Body() body: any) {
    try {
      const res = await fetch('http://localhost:3005/viewings', {
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
      const res = await fetch(`http://localhost:3005/viewings/${id}/take`, {
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
      const res = await fetch('http://localhost:3006/contracts');
      return res.json();
    } catch {
      return [];
    }
  }

  @Post('contracts')
  async createContract(@Body() body: any) {
    try {
      const res = await fetch('http://localhost:3006/contracts', {
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
      const res = await fetch('http://localhost:3007/commissions');
      return res.json();
    } catch {
      return [];
    }
  }

  // --- RUTAS DE NOTIFICACIONES (NOTIFICATIONS) ---
  @Get('notifications')
  async getNotifications() {
    try {
      const response = await fetch('http://localhost:3009/notifications');
      return response.json();
    } catch {
      return [];
    }
  }

  @Patch('notifications/:id/read')
  async markNotificationAsRead(@Param('id') id: string) {
    try {
      const response = await fetch(`http://localhost:3009/notifications/${id}/read`, {
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
      const res = await fetch('http://localhost:3010/analytics');
      return res.json();
    } catch {
      return { total_revenue: 0, total_sales: 0 };
    }
  }
}