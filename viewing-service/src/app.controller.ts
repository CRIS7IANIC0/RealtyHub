import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('viewings')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Obtener todas las visitas agendadas (ordenadas cronológicamente)
  @Get()
  async getAllViewings() {
    return this.prisma.viewing.findMany({
      orderBy: { scheduled_at: 'asc' },
    });
  }

  // 2. Agendar una nueva visita (sin requerir agent_id, por defecto 'Pendiente')
  @Post()
  async createViewing(
    @Body()
    body: {
      property_id: string;
      lead_id: string;
      scheduled_at: string;
      agent_id?: string;
      status?: string;
    },
  ) {
    if (!body.property_id || !body.lead_id || !body.scheduled_at) {
      throw new BadRequestException(
        'Los campos property_id, lead_id y scheduled_at son requeridos',
      );
    }

    const scheduledDate = new Date(body.scheduled_at);

    // REGLA DE NEGOCIO:
    // Buscar si ya existe una visita para ese mismo property_id en la misma fecha y hora (scheduled_at)
    const existingViewing = await this.prisma.viewing.findFirst({
      where: {
        property_id: body.property_id,
        scheduled_at: scheduledDate,
      },
    });

    if (existingViewing) {
      throw new BadRequestException(
        'La propiedad ya tiene una visita en ese horario',
      );
    }

    return this.prisma.viewing.create({
      data: {
        property_id: body.property_id,
        lead_id: body.lead_id,
        agent_id: body.agent_id || null,
        scheduled_at: scheduledDate,
        status: body.status || 'Pendiente',
      },
    });
  }

  // 3. Tomar visita (Lógica Uber: asigna el agent_id y actualiza status a 'Asignada')
  @Patch(':id/take')
  async takeViewing(
    @Param('id') id: string,
    @Body() body: { agent_id: string },
  ) {
    if (!body?.agent_id) {
      throw new BadRequestException(
        'El campo agent_id es obligatorio para tomar la visita',
      );
    }

    const viewing = await this.prisma.viewing.findUnique({
      where: { id },
    });

    if (!viewing) {
      throw new BadRequestException('Visita no encontrada');
    }

    return this.prisma.viewing.update({
      where: { id },
      data: {
        agent_id: body.agent_id,
        status: 'Asignada',
      },
    });
  }
}