import { Controller, Get, Post, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';

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

  @Get()
  async getAllProperties() {
    return this.prisma.property.findMany({
      orderBy: { title: 'asc' },
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
  async createProperty(
    @Body()
    data: {
      title: string;
      description: string;
      address: string;
      price: number;
      status?: string;
      images?: string[];
      image_url?: string;
    },
  ) {
    console.log('🏠 Guardando nueva propiedad en Property DB:', data.title);

    const images = Array.isArray(data.images)
      ? data.images
      : data.image_url
      ? [data.image_url]
      : [];

    return this.prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        address: data.address,
        price: data.price,
        status: data.status || 'Disponible',
        images: images,
      },
    });
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    console.log(`🏠 Actualizando estado de propiedad ${id} a:`, body.status);

    return this.prisma.property.update({
      where: { id },
      data: { status: body.status },
    });
  }

  @Patch(':id')
  async updateProperty(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      address?: string;
      price?: number;
      status?: string;
      images?: string[];
    },
  ) {
    console.log(`🏠 Actualizando propiedad ${id}`);

    return this.prisma.property.update({
      where: { id },
      data: body,
    });
  }
}