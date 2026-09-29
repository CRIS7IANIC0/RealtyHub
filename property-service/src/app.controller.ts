import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import {
  OPERATIONS,
  PROPERTY_TYPES,
  STATUSES,
  cleanImages,
  inferCity,
  inferOperation,
  inferType,
  normalizeOperation,
  normalizeStatus,
  normalizeType,
} from './property.utils';

interface PropertyInput {
  title?: string;
  description?: string;
  address?: string;
  price?: number | string;
  status?: string;
  operation?: string;
  property_type?: string;
  city?: string;
  images?: string[];
  /** Compatibilidad: clientes antiguos envían una sola imagen. */
  image_url?: string;
}

function badEnum(field: string, options: readonly string[]): never {
  throw new BadRequestException(`${field} debe ser uno de: ${options.join(', ')}`);
}

/**
 * Valida y normaliza el cuerpo de creación/edición.
 * En `partial` (PATCH) sólo se procesan los campos presentes.
 */
function parseInput(data: PropertyInput, partial: boolean): Prisma.PropertyUpdateInput {
  const out: Prisma.PropertyUpdateInput = {};

  for (const field of ['title', 'address'] as const) {
    if (data[field] !== undefined || !partial) {
      const value = typeof data[field] === 'string' ? data[field].trim() : '';
      if (!value) throw new BadRequestException(`El campo ${field} es obligatorio`);
      out[field] = value;
    }
  }

  if (data.description !== undefined || !partial) {
    out.description = typeof data.description === 'string' ? data.description.trim() : '';
  }

  if (data.price !== undefined || !partial) {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestException('El precio debe ser un número mayor a 0');
    }
    out.price = price;
  }

  if (data.status !== undefined) {
    out.status = normalizeStatus(data.status) ?? badEnum('status', STATUSES);
  }
  if (data.operation !== undefined) {
    out.operation = normalizeOperation(data.operation) ?? badEnum('operation', OPERATIONS);
  }
  if (data.property_type !== undefined && data.property_type !== '') {
    out.property_type = normalizeType(data.property_type) ?? badEnum('property_type', PROPERTY_TYPES);
  }
  if (data.city !== undefined) {
    out.city = typeof data.city === 'string' && data.city.trim() ? data.city.trim() : null;
  }

  const images = cleanImages(data.images);
  if (images !== undefined) out.images = images;
  else if (data.image_url) out.images = [data.image_url];

  return out;
}

@Controller('properties')
export class AppController {
  constructor(private readonly prisma: PrismaService) { }

  @EventPattern('contract.signed')
  async handleContractSigned(data: any) {
    try {
      const nuevoEstado = data.operation_type === 'Alquiler' ? 'Alquilada' : 'Vendida';
      await this.prisma.property.update({
        where: { id: data.property_id },
        data: { status: nuevoEstado }
      });
      console.log(`✅ Propiedad ${data.property_id} actualizada automáticamente a ${nuevoEstado}`);
    } catch (error) {
      console.error('❌ Error actualizando propiedad desde RabbitMQ:', error);
    }
  }

  /** Filtros opcionales: ?status=Disponible&operation=Alquiler&type=Casa&city=Montería */
  @Get()
  async getAllProperties(
    @Query('status') status?: string,
    @Query('operation') operation?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
  ) {
    const where: Prisma.PropertyWhereInput = {};
    if (status) where.status = { equals: normalizeStatus(status) ?? status, mode: 'insensitive' };
    if (operation) where.operation = { equals: operation, mode: 'insensitive' };
    if (type) where.property_type = { equals: type, mode: 'insensitive' };
    if (city) where.city = { contains: city, mode: 'insensitive' };

    return this.prisma.property.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  @Get(':id')
  async getPropertyById(@Param('id') id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(`Propiedad con ID ${id} no encontrada`);
    }

    return property;
  }

  @Post()
  async createProperty(@Body() data: PropertyInput) {
    console.log('🏠 Guardando nueva propiedad en Property DB:', data.title);

    const parsed = parseInput(data, false) as Prisma.PropertyCreateInput;
    const text = `${parsed.title} ${parsed.description}`;

    return this.prisma.property.create({
      data: {
        ...parsed,
        status: parsed.status ?? 'Disponible',
        images: parsed.images ?? [],
        // Si el cliente no los envía, se infieren igual que en el backfill
        operation: parsed.operation ?? inferOperation(text),
        property_type: parsed.property_type ?? inferType(text),
        city: parsed.city ?? inferCity(parsed.address),
      },
    });
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    console.log(`🏠 Actualizando estado de propiedad ${id} a:`, body.status);

    const status = normalizeStatus(body.status) ?? badEnum('status', STATUSES);
    return this.prisma.property.update({
      where: { id },
      data: { status },
    });
  }

  @Patch(':id')
  async updateProperty(@Param('id') id: string, @Body() body: PropertyInput) {
    console.log(`🏠 Actualizando propiedad ${id}`);

    return this.prisma.property.update({
      where: { id },
      data: parseInput(body, true),
    });
  }
}
